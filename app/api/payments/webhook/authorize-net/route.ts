import { headers } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { hmacSha512Hex } from "@/lib/utils/hash";
import { env } from "@/lib/config/env";
import { fail, ok } from "@/lib/http/response";
import { walletService } from "@/application/wallet/wallet.service";
import { guestWalletService } from "@/application/wallet/guest-wallet.service";
import { GuestTopupStatus, PaymentIntentStatus } from "@prisma/client";
import { logger } from "@/lib/logger";

type AuthorizePayload = {
  eventType?: string;
  notificationId?: string;
  payload?: {
    id?: string;
    order?: { invoiceNumber?: string };
  };
};

export async function POST(req: Request) {
  const rawBody = await req.text();
  const hdrs = await headers();
  const sigHeader = hdrs.get("x-anet-signature") ?? "";
  const expected = `sha512=${hmacSha512Hex(env.AUTHORIZE_NET_SIGNATURE_KEY, rawBody)}`;
  const signatureValid = sigHeader.toLowerCase() === expected.toLowerCase();

  let payload: AuthorizePayload = {};
  try {
    payload = JSON.parse(rawBody) as AuthorizePayload;
  } catch {
    return fail("Invalid payload", 400, "INVALID_JSON");
  }

  const eventType = String(payload.eventType ?? "unknown");
  const gatewayEventId = String(payload.notificationId ?? "");
  const dedupeKey = `anet:${gatewayEventId}:${eventType}`;

  const webhook = await prisma.paymentWebhookEvent.upsert({
    where: { dedupeKey },
    create: {
      provider: "AUTHORIZE_NET",
      eventType,
      gatewayEventId,
      signatureValid,
      payload: payload,
      dedupeKey,
    },
    update: {},
  });

  if (!signatureValid) {
    return fail("Invalid signature", 401, "INVALID_SIGNATURE");
  }

  const merchantTransactionId = payload.payload?.order?.invoiceNumber ?? "";

  if (merchantTransactionId) {
    const guestTopup = await prisma.guestTopupRequest.findUnique({
      where: { merchantTransactionId },
    });

    if (guestTopup) {
      const gatewayTransactionId = payload.payload?.id ?? guestTopup.gatewayTransactionId ?? "";

      let mappedStatus: GuestTopupStatus = "FAILED";
      let failureCode = "UNMAPPED_EVENT";
      let failureReason = `Unhandled webhook event: ${eventType}`;

      if (eventType.includes("authcapture.created")) {
        mappedStatus = "SETTLED";
        failureCode = "";
        failureReason = "";
      } else if (eventType.includes("fraud")) {
        mappedStatus = "FRAUD_HOLD";
        failureCode = "FRAUD_HOLD";
        failureReason = "Transaction placed on fraud hold by gateway";
      } else if (eventType.includes("declined")) {
        mappedStatus = "DECLINED";
        failureCode = "DECLINED";
        failureReason = "Transaction declined by gateway";
      } else if (eventType.includes("expired")) {
        mappedStatus = "EXPIRED";
        failureCode = "EXPIRED";
        failureReason = "Card or token expired";
      } else if (eventType.includes("timeout")) {
        mappedStatus = "TIMED_OUT";
        failureCode = "TIMEOUT";
        failureReason = "Gateway timeout";
      } else if (eventType.includes("duplicate")) {
        mappedStatus = "FAILED";
        failureCode = "DUPLICATE";
        failureReason = "Duplicate charge attempt detected";
      }

      await prisma.guestTopupRequest.update({
        where: { id: guestTopup.id },
        data: {
          status: mappedStatus,
          gatewayTransactionId,
          failureCode: failureCode || null,
          failureReason: failureReason || null,
          metadata:
            mappedStatus === "SETTLED"
              ? {
                  delivery: "email",
                  note: "Top-up settled; downstream email fulfillment should be triggered by worker.",
                }
              : undefined,
        },
      });
    }

    const payment = await prisma.paymentIntent.findUnique({
      where: { merchantTransactionId },
    });

    if (payment) {
      const gatewayTransactionId = payload.payload?.id ?? payment.gatewayTransactionId ?? "";

      if (eventType.includes("authcapture.created")) {
        const walletId = (payment as unknown as { walletId?: string | null }).walletId;
        if (walletId && !payment.userId) {
          const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });

          if (wallet && wallet.isGuest && wallet.sessionToken) {
            await guestWalletService.postSuccessfulGuestTopup({
              walletId: wallet.id,
              sessionToken: wallet.sessionToken,
              paymentIntentId: payment.id,
              gatewayTransactionId,
              idempotencyKey: payment.idempotencyKey,
            });
            logger.info({ paymentIntentId: payment.id, walletId: wallet.id }, "Guest wallet credited");
          }
        } else if (payment.userId) {
          await walletService.postSuccessfulRecharge({
            userId: payment.userId,
            paymentIntentId: payment.id,
            gatewayTransactionId,
            idempotencyKey: payment.idempotencyKey,
          });
          logger.info({ paymentIntentId: payment.id, userId: payment.userId }, "User wallet credited");
        }
      } else if (eventType.includes("fraud")) {
        await prisma.paymentIntent.update({
          where: { id: payment.id },
          data: {
            status: PaymentIntentStatus.FRAUD_HOLD,
            failureCode: "FRAUD_HOLD",
            failureReason: "Transaction placed on fraud hold by gateway",
            gatewayTransactionId,
          },
        });
      } else if (eventType.includes("declined")) {
        await prisma.paymentIntent.update({
          where: { id: payment.id },
          data: {
            status: PaymentIntentStatus.DECLINED,
            failureCode: "DECLINED",
            failureReason: "Transaction declined by gateway",
            gatewayTransactionId,
          },
        });
      } else if (eventType.includes("expired")) {
        await prisma.paymentIntent.update({
          where: { id: payment.id },
          data: {
            status: PaymentIntentStatus.EXPIRED,
            failureCode: "EXPIRED",
            failureReason: "Card or token expired",
            gatewayTransactionId,
          },
        });
      } else if (eventType.includes("timeout")) {
        await prisma.paymentIntent.update({
          where: { id: payment.id },
          data: {
            status: PaymentIntentStatus.TIMED_OUT,
            failureCode: "TIMEOUT",
            failureReason: "Gateway timeout",
            gatewayTransactionId,
          },
        });
      } else if (eventType.includes("duplicate")) {
        await prisma.paymentIntent.update({
          where: { id: payment.id },
          data: {
            status: PaymentIntentStatus.FAILED,
            failureCode: "DUPLICATE",
            failureReason: "Duplicate charge attempt detected",
            gatewayTransactionId,
          },
        });
      } else {
        await prisma.paymentIntent.update({
          where: { id: payment.id },
          data: {
            status: PaymentIntentStatus.FAILED,
            failureCode: "UNMAPPED_EVENT",
            failureReason: `Unhandled webhook event: ${eventType}`,
            gatewayTransactionId,
          },
        });
      }
    }
  }

  await prisma.paymentWebhookEvent.update({
    where: { id: webhook.id },
    data: { processed: true, processedAt: new Date() },
  });

  return ok({ received: true });
}
