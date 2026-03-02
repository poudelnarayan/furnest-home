import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/security/auth-context";
import { requireRole } from "@/lib/rbac/roles";
import { AppError } from "@/lib/http/errors";
import { fail, ok } from "@/lib/http/response";

const schema = z.object({
  userId: z.string().min(1),
  amountCents: z.number().int().positive(),
  reason: z.string().min(5),
  type: z.enum(["CREDIT", "DEBIT"]),
  idempotencyKey: z.string().uuid(),
});

export async function POST(req: Request) {
  try {
    const auth = await requireAuth();
    requireRole(auth.role, ["ADMIN", "SUPPORT"]);

    const input = schema.parse(await req.json());

    const adjustment = await prisma.walletAdjustment.create({
      data: {
        userId: input.userId,
        adminUserId: auth.sub,
        amountCents: BigInt(input.amountCents),
        reason: input.reason,
        type: input.type,
        idempotencyKey: input.idempotencyKey,
      },
    });

    return ok({ adjustment }, 201);
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
