import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { ok } from "@/lib/http/response";
import { sha256 } from "@/lib/utils/hash";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const body = await req.json();
  const { email } = schema.parse(body);

  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const rawToken = crypto.randomBytes(32).toString("hex");
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: sha256(rawToken),
        expiresAt: new Date(Date.now() + 1000 * 60 * 30),
      },
    });
  }

  return ok({ accepted: true });
}
