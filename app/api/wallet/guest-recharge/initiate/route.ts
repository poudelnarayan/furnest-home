import { randomUUID } from "crypto";
import { z } from "zod";
import { createAuthorizeNetTransaction } from "@/application/payments/authorizenet.service";
import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/http/errors";
import { fail, ok } from "@/lib/http/response";

const schema = z.object({
  amountCents: z.number().int().positive().max(500000),
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(80),
  email: z.string().email().max(200),
  opaqueDataValue: z.string().min(10),
  opaqueDataDescriptor: z.string().min(5),
  idempotencyKey: z.string().uuid(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = schema.parse(body);

    const existing = await prisma.guestTopupRequest.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });

    if (existing) {
      return ok({
        guestTopupId: existing.id,
        gatewayTransactionId: existing.gatewayTransactionId,
        status: existing.status,
      });
    }

    const merchantTransactionId = `GUEST-WL-${randomUUID()}`;

    const topup = await prisma.guestTopupRequest.create({
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        amountCents: BigInt(input.amountCents),
        idempotencyKey: input.idempotencyKey,
        merchantTransactionId,
        status: "INITIATED",
      },
    });

    const tx = await createAuthorizeNetTransaction({
      amount: input.amountCents / 100,
      opaqueDataValue: input.opaqueDataValue,
      opaqueDataDescriptor: input.opaqueDataDescriptor,
      invoiceNumber: merchantTransactionId,
      customer: {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
      },
    });

    await prisma.guestTopupRequest.update({
      where: { id: topup.id },
      data: {
        status: "PENDING_GATEWAY",
        gatewayTransactionId: tx.transactionId,
      },
    });

    return ok({
      guestTopupId: topup.id,
      gatewayTransactionId: tx.transactionId,
      status: "PENDING_WEBHOOK",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail("Validation failed", 422, "VALIDATION_ERROR");
    }
    if (error instanceof AppError) {
      return fail(error.message, error.statusCode, error.code);
    }
    return fail("Internal server error", 500, "INTERNAL_ERROR");
  }
}
