import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/security/auth-context";
import { requireRole } from "@/lib/rbac/roles";
import { fail, ok } from "@/lib/http/response";
import { voidAuthorizeNetTransaction } from "@/application/payments/authorizenet.service";

const schema = z.object({
  paymentIntentId: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const auth = await requireAuth();
    requireRole(auth.role, ["ADMIN"]);

    const input = schema.parse(await req.json());
    const payment = await prisma.paymentIntent.findUnique({ where: { id: input.paymentIntentId } });
    if (!payment || !payment.gatewayTransactionId) {
      return fail("Payment not voidable", 400, "NOT_VOIDABLE");
    }

    const response = await voidAuthorizeNetTransaction({
      transactionId: payment.gatewayTransactionId,
    });

    return ok({ response });
  } catch {
    return fail("Invalid request", 422, "VALIDATION_ERROR");
  }
}
