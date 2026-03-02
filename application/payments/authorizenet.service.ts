import { env } from "@/lib/config/env";
import { AppError } from "@/lib/http/errors";

const endpointByEnv = {
  sandbox: "https://apitest.authorize.net/xml/v1/request.api",
  production: "https://api2.authorize.net/xml/v1/request.api",
} as const;

type CreateTransactionInput = {
  amount: number;
  opaqueDataValue: string;
  opaqueDataDescriptor: string;
  invoiceNumber: string;
  customer?: {
    firstName: string;
    lastName: string;
    email: string;
  };
};

export async function createAuthorizeNetTransaction(input: CreateTransactionInput) {
  const body = {
    createTransactionRequest: {
      merchantAuthentication: {
        name: env.AUTHORIZE_NET_API_LOGIN_ID,
        transactionKey: env.AUTHORIZE_NET_TRANSACTION_KEY,
      },
      refId: input.invoiceNumber,
      transactionRequest: {
        transactionType: "authCaptureTransaction",
        amount: input.amount.toFixed(2),
        payment: {
          opaqueData: {
            dataDescriptor: input.opaqueDataDescriptor,
            dataValue: input.opaqueDataValue,
          },
        },
        order: { invoiceNumber: input.invoiceNumber },
        billTo: input.customer
          ? {
              firstName: input.customer.firstName,
              lastName: input.customer.lastName,
            }
          : undefined,
        customer: input.customer
          ? {
              email: input.customer.email,
            }
          : undefined,
      },
    },
  };

  const response = await fetch(endpointByEnv[env.AUTHORIZE_NET_ENV], {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new AppError("Gateway request failed", "GATEWAY_HTTP_ERROR", 502);
  }

  const data = await response.json();
  const resultCode = data?.messages?.resultCode;
  if (resultCode !== "Ok") {
    const message = data?.messages?.message?.[0]?.text ?? "Gateway error";
    throw new AppError(message, "GATEWAY_DECLINED", 402);
  }

  return {
    transactionId: data.transactionResponse.transId as string,
    authCode: data.transactionResponse.authCode as string | undefined,
    responseCode: data.transactionResponse.responseCode as string,
    raw: data,
  };
}

export async function refundAuthorizeNetTransaction(input: {
  amount: number;
  transactionId: string;
  last4: string;
  expiry: string;
}) {
  const body = {
    createTransactionRequest: {
      merchantAuthentication: {
        name: env.AUTHORIZE_NET_API_LOGIN_ID,
        transactionKey: env.AUTHORIZE_NET_TRANSACTION_KEY,
      },
      transactionRequest: {
        transactionType: "refundTransaction",
        amount: input.amount.toFixed(2),
        payment: {
          creditCard: {
            cardNumber: input.last4,
            expirationDate: input.expiry,
          },
        },
        refTransId: input.transactionId,
      },
    },
  };

  const response = await fetch(endpointByEnv[env.AUTHORIZE_NET_ENV], {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  return response.json();
}

export async function voidAuthorizeNetTransaction(input: { transactionId: string }) {
  const body = {
    createTransactionRequest: {
      merchantAuthentication: {
        name: env.AUTHORIZE_NET_API_LOGIN_ID,
        transactionKey: env.AUTHORIZE_NET_TRANSACTION_KEY,
      },
      transactionRequest: {
        transactionType: "voidTransaction",
        refTransId: input.transactionId,
      },
    },
  };

  const response = await fetch(endpointByEnv[env.AUTHORIZE_NET_ENV], {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  return response.json();
}
