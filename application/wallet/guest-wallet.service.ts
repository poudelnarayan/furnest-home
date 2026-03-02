import crypto from "crypto";
import { LedgerEntryType, LedgerStatus, PaymentIntentStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/http/errors";
import { logger } from "@/lib/logger";

type CreateGuestWalletInput = {
  email: string;
  sessionToken?: string;
};

type GuestTopupInput = {
  walletId: string;
  sessionToken: string;
  paymentIntentId: string;
  gatewayTransactionId: string;
  idempotencyKey: string;
};

export const guestWalletService = {
  async createGuestWallet(input: CreateGuestWalletInput) {
    const sessionToken = input.sessionToken ?? crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

    const existing = await prisma.wallet.findFirst({
      where: {
        isGuest: true,
        guestEmail: input.email,
      },
    });

    if (existing) {
      logger.info({ walletId: existing.id, email: input.email }, "Returning existing guest wallet");
      return {
        wallet: existing,
        sessionToken: existing.sessionToken ?? sessionToken,
        isNew: false,
      };
    }

    const wallet = await prisma.wallet.create({
      data: {
        isGuest: true,
        guestEmail: input.email,
        sessionToken,
        currency: "USD",
        expiresAt,
      },
    });

    logger.info({ walletId: wallet.id, email: input.email }, "Created new guest wallet");

    return {
      wallet,
      sessionToken,
      isNew: true,
    };
  },

  async getGuestWalletBySession(sessionToken: string) {
    const wallet = await prisma.wallet.findUnique({
      where: { sessionToken, isGuest: true },
    });

    if (!wallet) {
      throw new AppError("Guest wallet not found", "WALLET_NOT_FOUND", 404);
    }

    if (wallet.expiresAt && wallet.expiresAt < new Date()) {
      throw new AppError("Guest wallet expired", "WALLET_EXPIRED", 410);
    }

    return wallet;
  },

  async postSuccessfulGuestTopup(input: GuestTopupInput) {
    return prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${input.walletId}))`;

      const wallet = await tx.wallet.findUnique({
        where: { id: input.walletId, isGuest: true },
      });

      if (!wallet) {
        throw new AppError("Guest wallet not found", "WALLET_NOT_FOUND", 404);
      }

      if (wallet.sessionToken !== input.sessionToken) {
        throw new AppError("Invalid session token", "INVALID_SESSION", 403);
      }

      const payment = await tx.paymentIntent.findUnique({
        where: { id: input.paymentIntentId },
      });

      if (!payment) {
        throw new AppError("Payment intent not found", "PAYMENT_NOT_FOUND", 404);
      }

      if (payment.status === PaymentIntentStatus.SETTLED) {
        logger.info({ paymentIntentId: payment.id }, "Payment already settled");
        return payment;
      }

      const existingLedger = await tx.walletLedgerEntry.findFirst({
        where: {
          walletId: wallet.id,
          idempotencyKey: input.idempotencyKey,
        },
      });

      if (!existingLedger) {
        await tx.walletLedgerEntry.create({
          data: {
            walletId: wallet.id,
            userId: wallet.userId ?? "GUEST",
            type: LedgerEntryType.CREDIT,
            status: LedgerStatus.POSTED,
            amountCents: payment.amountCents,
            currency: payment.currency,
            referenceType: "PAYMENT_INTENT",
            referenceId: payment.id,
            idempotencyKey: input.idempotencyKey,
            postedAt: new Date(),
            metadata: {
              paymentMethod: payment.paymentMethod,
              gatewayTransactionId: input.gatewayTransactionId,
            },
          },
        });
      }

      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          availableCents: { increment: payment.amountCents },
          updatedAt: new Date(),
        },
      });

      const updatedPayment = await tx.paymentIntent.update({
        where: { id: payment.id },
        data: {
          status: PaymentIntentStatus.SETTLED,
          gatewayTransactionId: input.gatewayTransactionId,
        },
      });

      logger.info({ walletId: wallet.id, paymentIntentId: payment.id }, "Guest wallet credited");

      return updatedPayment;
    });
  },

  async getGuestWalletBalance(walletId: string, sessionToken: string) {
    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId, sessionToken, isGuest: true },
    });

    if (!wallet) {
      throw new AppError("Guest wallet not found", "WALLET_NOT_FOUND", 404);
    }

    return {
      availableCents: wallet.availableCents,
      pendingCents: wallet.pendingCents,
      currency: wallet.currency,
    };
  },

  async getGuestWalletTransactions(walletId: string, sessionToken: string, limit = 50) {
    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId, sessionToken, isGuest: true },
    });

    if (!wallet) {
      throw new AppError("Guest wallet not found", "WALLET_NOT_FOUND", 404);
    }

    const transactions = await prisma.walletLedgerEntry.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return transactions;
  },
};
