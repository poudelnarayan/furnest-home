"use client";

import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

declare global {
  interface Window {
    Accept?: {
      dispatchData: (
        data: {
          authData: { clientKey: string; apiLoginID: string };
          cardData?: { cardNumber: string; month: string; year: string; cardCode: string };
        },
        callback: (response: { messages: { resultCode: string; message: Array<{ code: string; text: string }> }; opaqueData?: { dataDescriptor: string; dataValue: string } }) => void
      ) => void;
    };
    ApplePaySession?: {
      canMakePayments: () => boolean;
      supportsVersion: (version: number) => boolean;
    };
  }
}

type WalletData = {
  walletId: string;
  sessionToken: string;
  balance: {
    availableCents: bigint;
    pendingCents: bigint;
    currency: string;
  };
};

export function GuestWalletTopup() {
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CREDIT_CARD" | "APPLE_PAY" | "GOOGLE_PAY">("CREDIT_CARD");

  const [cardNumber, setCardNumber] = useState("");
  const [expMonth, setExpMonth] = useState("");
  const [expYear, setExpYear] = useState("");
  const [cvv, setCvv] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [applePayAvailable, setApplePayAvailable] = useState(false);
  const [googlePayAvailable, setGooglePayAvailable] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const appleSupported = window.ApplePaySession?.canMakePayments() ?? false;
      setApplePayAvailable(appleSupported);

      setGooglePayAvailable(true);
    }
  }, []);

  const createGuestWallet = async () => {
    if (!email) {
      setError("Email is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/wallet/guest/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to create wallet");
      }

      setWallet({
        walletId: data.data.walletId,
        sessionToken: data.data.sessionToken,
        balance: data.data.balance,
      });

      setSuccess("Wallet created successfully!");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async (opaqueDataValue: string, opaqueDataDescriptor: string, method: "CREDIT_CARD" | "APPLE_PAY" | "GOOGLE_PAY") => {
    if (!wallet) return;

    const amountCents = Math.round(parseFloat(amount) * 100);

    try {
      const res = await fetch("/api/wallet/guest/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletId: wallet.walletId,
          sessionToken: wallet.sessionToken,
          amountCents,
          paymentMethod: method,
          opaqueDataValue,
          opaqueDataDescriptor,
          customer: {
            firstName: firstName || "Guest",
            lastName: lastName || "User",
            email,
          },
          idempotencyKey: uuidv4(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Payment failed");
      }

      setSuccess(`Payment successful! Transaction ID: ${data.data.gatewayTransactionId}`);
      setAmount("");
      setCardNumber("");
      setExpMonth("");
      setExpYear("");
      setCvv("");

      const balanceRes = await fetch("/api/wallet/guest/balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletId: wallet.walletId,
          sessionToken: wallet.sessionToken,
        }),
      });

      const balanceData = await balanceRes.json();
      if (balanceRes.ok) {
        setWallet({ ...wallet, balance: balanceData.data.balance });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreditCardPayment = () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError("Valid amount required");
      return;
    }

    if (!cardNumber || !expMonth || !expYear || !cvv) {
      setError("All card fields required");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    const authData = {
      clientKey: process.env.NEXT_PUBLIC_AUTHORIZE_NET_CLIENT_KEY || "",
      apiLoginID: process.env.NEXT_PUBLIC_AUTHORIZE_NET_API_LOGIN_ID || "",
    };

    const cardData = {
      cardNumber: cardNumber.replace(/\s/g, ""),
      month: expMonth,
      year: expYear,
      cardCode: cvv,
    };

    if (!window.Accept) {
      setError("Accept.js not loaded");
      setLoading(false);
      return;
    }

    window.Accept.dispatchData({ authData, cardData }, (response) => {
      if (response.messages.resultCode === "Error") {
        setError(response.messages.message[0].text);
        setLoading(false);
        return;
      }

      if (response.opaqueData) {
        processPayment(response.opaqueData.dataValue, response.opaqueData.dataDescriptor, "CREDIT_CARD");
      }
    });
  };

  const handleApplePay = () => {
    setError("Apple Pay integration requires merchant certificate setup");
  };

  const handleGooglePay = () => {
    setError("Google Pay integration requires merchant setup");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-3xl font-bold text-white mb-8">Guest Wallet Top-Up</h1>

          {!wallet ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="your@email.com"
                />
              </div>

              <button
                onClick={createGuestWallet}
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
              >
                {loading ? "Creating..." : "Create Wallet"}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-400">Available Balance</span>
                  <span className="text-2xl font-bold text-green-400">
                    ${(Number(wallet.balance.availableCents) / 100).toFixed(2)}
                  </span>
                </div>
                <div className="text-xs text-slate-500">{wallet.balance.currency}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Payment Method</label>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <button
                    onClick={() => setPaymentMethod("CREDIT_CARD")}
                    className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                      paymentMethod === "CREDIT_CARD"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                  >
                    Card
                  </button>
                  <button
                    onClick={() => applePayAvailable && setPaymentMethod("APPLE_PAY")}
                    disabled={!applePayAvailable}
                    className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                      paymentMethod === "APPLE_PAY"
                        ? "bg-blue-600 text-white"
                        : applePayAvailable
                        ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                        : "bg-slate-800 text-slate-600 cursor-not-allowed"
                    }`}
                  >
                    Apple Pay
                  </button>
                  <button
                    onClick={() => googlePayAvailable && setPaymentMethod("GOOGLE_PAY")}
                    disabled={!googlePayAvailable}
                    className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                      paymentMethod === "GOOGLE_PAY"
                        ? "bg-blue-600 text-white"
                        : googlePayAvailable
                        ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                        : "bg-slate-800 text-slate-600 cursor-not-allowed"
                    }`}
                  >
                    Google Pay
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Amount (USD)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>

              {paymentMethod === "CREDIT_CARD" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">First Name</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Last Name</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Card Number</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="4111 1111 1111 1111"
                      maxLength={19}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Month</label>
                      <input
                        type="text"
                        value={expMonth}
                        onChange={(e) => setExpMonth(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="12"
                        maxLength={2}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Year</label>
                      <input
                        type="text"
                        value={expYear}
                        onChange={(e) => setExpYear(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="2025"
                        maxLength={4}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">CVV</label>
                      <input
                        type="text"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="123"
                        maxLength={4}
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleCreditCardPayment}
                    disabled={loading}
                    className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
                  >
                    {loading ? "Processing..." : "Pay with Card"}
                  </button>
                </div>
              )}

              {paymentMethod === "APPLE_PAY" && (
                <button
                  onClick={handleApplePay}
                  disabled={loading}
                  className="w-full py-3 bg-black hover:bg-gray-900 disabled:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
                >
                  {loading ? "Processing..." : "Pay with Apple Pay"}
                </button>
              )}

              {paymentMethod === "GOOGLE_PAY" && (
                <button
                  onClick={handleGooglePay}
                  disabled={loading}
                  className="w-full py-3 bg-white hover:bg-gray-100 disabled:bg-slate-600 text-gray-900 font-semibold rounded-lg transition-colors"
                >
                  {loading ? "Processing..." : "Pay with Google Pay"}
                </button>
              )}
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-900/30 border border-red-600 rounded-lg text-red-400">{error}</div>
          )}

          {success && (
            <div className="mt-4 p-4 bg-green-900/30 border border-green-600 rounded-lg text-green-400">{success}</div>
          )}
        </div>
      </div>
    </div>
  );
}
