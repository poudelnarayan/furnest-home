import { z } from "zod";
import { randomUUID } from "crypto";
import { walletService } from "@/application/wallet/wallet.service";
import { createAuthorizeNetTransaction } from "@/application/payments/authorizenet.service";
import { requireAuth } from "@/lib/security/auth-context";
import { fail, ok } from "@/lib/http/response";
import { AppError } from "@/lib/http/errors";

const schema = z.object({
  amountCents: z.number().int().positive().max(500000),
  opaqueDataValue: z.string().min(10),
  opaqueDataDescriptor: z.string().min(5),
  idempotencyKey: z.string().uuid(),
});

export async function POST(req: Request) {
  try {
    const auth = await requireAuth();
    const body = await req.json();
    const input = schema.parse(body);

    const intent = await walletService.createRechargeIntent({
      userId: auth.sub,
      amountCents: BigInt(input.amountCents),
      idempotencyKey: input.idempotencyKey,
      merchantTransactionId: `WL-${randomUUID()}`,
    });

    const tx = await createAuthorizeNetTransaction({
      amount: input.amountCents / 100,
      opaqueDataValue: input.opaqueDataValue,
      opaqueDataDescriptor: input.opaqueDataDescriptor,
      invoiceNumber: intent.merchantTransactionId,
    });

    return ok({
      paymentIntentId: intent.id,
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
