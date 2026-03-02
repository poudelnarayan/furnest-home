import { LedgerEntryType, LedgerStatus, PaymentIntentStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/http/errors";

export const walletService = {
  async createRechargeIntent(input: {
    userId: string;
    amountCents: bigint;
    idempotencyKey: string;
    merchantTransactionId: string;
  }) {
    const existing = await prisma.paymentIntent.findFirst({
      where: { userId: input.userId, idempotencyKey: input.idempotencyKey },
    });

    if (existing) {
      return existing;
    }

    return prisma.paymentIntent.create({
      data: {
        userId: input.userId,
        provider: "AUTHORIZE_NET",
        amountCents: input.amountCents,
        currency: "USD",
        status: PaymentIntentStatus.INITIATED,
        idempotencyKey: input.idempotencyKey,
        merchantTransactionId: input.merchantTransactionId,
      },
    });
  },

  async postSuccessfulRecharge(input: {
    userId: string;
    paymentIntentId: string;
    gatewayTransactionId: string;
    idempotencyKey: string;
  }) {
    return prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${input.userId}))`;

      const payment = await tx.paymentIntent.findUnique({ where: { id: input.paymentIntentId } });
      if (!payment) {
        throw new AppError("Payment intent not found", "PAYMENT_NOT_FOUND", 404);
      }

      if (payment.status === PaymentIntentStatus.SETTLED) {
        return payment;
      }

      const wallet = await tx.wallet.upsert({
        where: { userId: input.userId },
        create: { userId: input.userId, currency: "USD" },
        update: {},
      });

      const existingLedger = await tx.walletLedgerEntry.findFirst({
        where: { walletId: wallet.id, idempotencyKey: input.idempotencyKey },
      });

      if (!existingLedger) {
        await tx.walletLedgerEntry.create({
          data: {
            walletId: wallet.id,
            userId: input.userId,
            type: LedgerEntryType.CREDIT,
            status: LedgerStatus.POSTED,
            amountCents: payment.amountCents,
            currency: payment.currency,
            referenceType: "PAYMENT_INTENT",
            referenceId: payment.id,
            idempotencyKey: input.idempotencyKey,
            postedAt: new Date(),
          },
        });
      }

      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          availableCents: { increment: payment.amountCents },
        },
      });

      return tx.paymentIntent.update({
        where: { id: payment.id },
        data: {
          status: PaymentIntentStatus.SETTLED,
          gatewayTransactionId: input.gatewayTransactionId,
        },
      });
    });
  },

  async debitForOrder(input: {
    userId: string;
    orderId: string;
    amountCents: bigint;
    idempotencyKey: string;
  }) {
    return prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${input.userId}))`;

      const wallet = await tx.wallet.findUnique({ where: { userId: input.userId } });
      if (!wallet) {
        throw new AppError("Wallet not found", "WALLET_NOT_FOUND", 404);
      }

      if (wallet.availableCents < input.amountCents) {
        throw new AppError("Insufficient balance", "INSUFFICIENT_BALANCE", 402);
      }

      await tx.walletLedgerEntry.create({
        data: {
          walletId: wallet.id,
          userId: input.userId,
          type: LedgerEntryType.DEBIT,
          status: LedgerStatus.POSTED,
          amountCents: input.amountCents,
          currency: wallet.currency,
          referenceType: "ORDER",
          referenceId: input.orderId,
          idempotencyKey: input.idempotencyKey,
          postedAt: new Date(),
        },
      });

      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          availableCents: { decrement: input.amountCents },
        },
      });

      return {
        debitedAmount: Number(input.amountCents) / 100,
      };
    });
  },
};
