import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/security/auth-context";
import { requireRole } from "@/lib/rbac/roles";
import { fail, ok } from "@/lib/http/response";
import { refundAuthorizeNetTransaction } from "@/application/payments/authorizenet.service";

const schema = z.object({
  paymentIntentId: z.string().min(1),
  amountCents: z.number().int().positive(),
  last4: z.string().length(4),
  expiry: z.string().min(4),
});

export async function POST(req: Request) {
  try {
    const auth = await requireAuth();
    requireRole(auth.role, ["ADMIN"]);

    const input = schema.parse(await req.json());
    const payment = await prisma.paymentIntent.findUnique({ where: { id: input.paymentIntentId } });
    if (!payment || !payment.gatewayTransactionId) {
      return fail("Payment not refundable", 400, "NOT_REFUNDABLE");
    }

    const response = await refundAuthorizeNetTransaction({
      amount: input.amountCents / 100,
      transactionId: payment.gatewayTransactionId,
      last4: input.last4,
      expiry: input.expiry,
    });

    return ok({ response });
  } catch {
    return fail("Invalid request", 422, "VALIDATION_ERROR");
  }
}
