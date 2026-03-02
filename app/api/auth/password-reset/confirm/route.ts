import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { password } from "@/lib/security/password";
import { fail, ok } from "@/lib/http/response";
import { sha256 } from "@/lib/utils/hash";

const schema = z.object({
  token: z.string().min(32),
  newPassword: z.string().min(10).max(128),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, newPassword } = schema.parse(body);

    const tokenHash = sha256(token);
    const reset = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

    if (!reset || reset.consumedAt || reset.expiresAt < new Date()) {
      return fail("Invalid or expired token", 400, "INVALID_TOKEN");
    }

    const passwordHash = await password.hash(newPassword);

    await prisma.$transaction([
      prisma.user.update({ where: { id: reset.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.update({ where: { id: reset.id }, data: { consumedAt: new Date() } }),
    ]);

    return ok({ reset: true });
  } catch {
    return fail("Validation failed", 422, "VALIDATION_ERROR");
  }
}
