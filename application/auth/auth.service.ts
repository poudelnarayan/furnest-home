import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";
import { password } from "@/lib/security/password";
import { signAccessToken } from "@/lib/security/jwt";
import { AppError } from "@/lib/http/errors";
import { sha256 } from "@/lib/utils/hash";

export const authService = {
  async register(input: { email: string; fullName: string; password: string }) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new AppError("Email already in use", "EMAIL_EXISTS", 409);
    }

    const passwordHash = await password.hash(input.password);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        fullName: input.fullName,
        passwordHash,
      },
    });

    const rawToken = crypto.randomBytes(32).toString("hex");
    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash: sha256(rawToken),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      },
    });

    return { userId: user.id, verificationToken: rawToken };
  },

  async login(input: { email: string; password: string }) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user) {
      throw new AppError("Invalid credentials", "INVALID_CREDENTIALS", 401);
    }

    const valid = await password.verify(input.password, user.passwordHash);
    if (!valid) {
      throw new AppError("Invalid credentials", "INVALID_CREDENTIALS", 401);
    }

    if (user.status !== "ACTIVE") {
      throw new AppError("Email verification required", "EMAIL_NOT_VERIFIED", 403);
    }

    const accessToken = await signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return { accessToken, user };
  },

  async verifyEmail(rawToken: string) {
    const tokenHash = sha256(rawToken);
    const record = await prisma.emailVerificationToken.findUnique({ where: { tokenHash } });

    if (!record || record.consumedAt || record.expiresAt < new Date()) {
      throw new AppError("Invalid or expired token", "INVALID_TOKEN", 400);
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { status: "ACTIVE", emailVerifiedAt: new Date() },
      }),
      prisma.emailVerificationToken.update({
        where: { id: record.id },
        data: { consumedAt: new Date() },
      }),
      prisma.wallet.upsert({
        where: { userId: record.userId },
        create: { userId: record.userId, currency: "USD" },
        update: {},
      }),
    ]);
  },
};
