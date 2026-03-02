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
    <div className="relative min-h-screen bg-[#0a0a0f]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40"></div>

      <div className="relative mx-auto max-w-2xl px-4 py-16">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-400/30 bg-purple-500/10 px-4 py-2 backdrop-blur-sm">
            <div className="h-2 w-2 animate-pulse rounded-full bg-purple-400"></div>
            <span className="text-sm font-semibold uppercase tracking-wider text-purple-200">Guest Wallet</span>
          </div>
          <h1 className="text-5xl font-black text-white">Top Up & Play</h1>
          <p className="mt-3 text-gray-400">No registration required. Start gaming in seconds.</p>
        </div>

        <div className="rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-900/40 via-indigo-900/40 to-pink-900/40 p-8 backdrop-blur-xl">
          {!wallet ? (
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-300">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-purple-500/30 bg-black/50 px-4 py-4 text-white placeholder-gray-500 backdrop-blur-sm transition-all focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  placeholder="your@email.com"
                />
              </div>

              <button
                onClick={createGuestWallet}
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 font-bold text-white transition-all hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50 disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading ? "Creating..." : "Create Wallet"}
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-600/20 to-pink-600/20 p-6 backdrop-blur-sm">
                <div className="absolute right-4 top-4 text-6xl opacity-20">💰</div>
                <div className="relative">
                  <div className="text-sm font-semibold uppercase tracking-wider text-purple-300">Wallet Balance</div>
                  <div className="mt-2 text-5xl font-black text-white">
                    ${(Number(wallet.balance.availableCents) / 100).toFixed(2)}
                  </div>
                  <div className="mt-1 text-xs text-gray-400">{wallet.balance.currency}</div>
                </div>
              </div>

              <div>
                <label className="mb-3 block text-sm font-bold text-gray-300">Payment Method</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setPaymentMethod("CREDIT_CARD")}
                    className={`rounded-xl border-2 py-4 font-bold transition-all ${
                      paymentMethod === "CREDIT_CARD"
                        ? "border-purple-500 bg-purple-500/20 text-white"
                        : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20"
                    }`}
                  >
                    💳 Card
                  </button>
                  <button
                    onClick={() => applePayAvailable && setPaymentMethod("APPLE_PAY")}
                    disabled={!applePayAvailable}
                    className={`rounded-xl border-2 py-4 font-bold transition-all ${
                      paymentMethod === "APPLE_PAY"
                        ? "border-purple-500 bg-purple-500/20 text-white"
                        : applePayAvailable
                        ? "border-white/10 bg-white/5 text-gray-400 hover:border-white/20"
                        : "cursor-not-allowed border-white/5 bg-white/5 text-gray-600"
                    }`}
                  >
                     Apple
                  </button>
                  <button
                    onClick={() => googlePayAvailable && setPaymentMethod("GOOGLE_PAY")}
                    disabled={!googlePayAvailable}
                    className={`rounded-xl border-2 py-4 font-bold transition-all ${
                      paymentMethod === "GOOGLE_PAY"
                        ? "border-purple-500 bg-purple-500/20 text-white"
                        : googlePayAvailable
                        ? "border-white/10 bg-white/5 text-gray-400 hover:border-white/20"
                        : "cursor-not-allowed border-white/5 bg-white/5 text-gray-600"
                    }`}
                  >
                    🔵 Google
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-gray-300">Top-Up Amount (USD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-500">$</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-xl border border-purple-500/30 bg-black/50 py-4 pl-10 pr-4 text-2xl font-bold text-white placeholder-gray-500 backdrop-blur-sm transition-all focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div className="mt-3 flex gap-2">
                  {[10, 25, 50, 100].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setAmount(preset.toString())}
                      className="flex-1 rounded-lg border border-purple-500/30 bg-purple-500/10 py-2 text-sm font-bold text-purple-300 transition-all hover:bg-purple-500/20"
                    >
                      ${preset}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === "CREDIT_CARD" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-2 block text-sm font-bold text-gray-300">First Name</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full rounded-xl border border-purple-500/30 bg-black/50 px-4 py-3 text-white placeholder-gray-500 backdrop-blur-sm transition-all focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-bold text-gray-300">Last Name</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full rounded-xl border border-purple-500/30 bg-black/50 px-4 py-3 text-white placeholder-gray-500 backdrop-blur-sm transition-all focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-gray-300">Card Number</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full rounded-xl border border-purple-500/30 bg-black/50 px-4 py-3 text-white placeholder-gray-500 backdrop-blur-sm transition-all focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      placeholder="4111 1111 1111 1111"
                      maxLength={19}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="mb-2 block text-sm font-bold text-gray-300">Month</label>
                      <input
                        type="text"
                        value={expMonth}
                        onChange={(e) => setExpMonth(e.target.value)}
                        className="w-full rounded-xl border border-purple-500/30 bg-black/50 px-4 py-3 text-white placeholder-gray-500 backdrop-blur-sm transition-all focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        placeholder="12"
                        maxLength={2}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-bold text-gray-300">Year</label>
                      <input
                        type="text"
                        value={expYear}
                        onChange={(e) => setExpYear(e.target.value)}
                        className="w-full rounded-xl border border-purple-500/30 bg-black/50 px-4 py-3 text-white placeholder-gray-500 backdrop-blur-sm transition-all focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        placeholder="2025"
                        maxLength={4}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-bold text-gray-300">CVV</label>
                      <input
                        type="text"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                        className="w-full rounded-xl border border-purple-500/30 bg-black/50 px-4 py-3 text-white placeholder-gray-500 backdrop-blur-sm transition-all focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        placeholder="123"
                        maxLength={4}
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleCreditCardPayment}
                    disabled={loading}
                    className="w-full rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 font-bold text-white transition-all hover:scale-105 hover:shadow-2xl hover:shadow-green-500/50 disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {loading ? "Processing..." : "💳 Pay with Card"}
                  </button>
                </div>
              )}

              {paymentMethod === "APPLE_PAY" && (
                <button
                  onClick={handleApplePay}
                  disabled={loading}
                  className="w-full rounded-xl bg-black px-6 py-4 font-bold text-white transition-all hover:scale-105 disabled:opacity-50"
                >
                  {loading ? "Processing..." : " Pay with Apple Pay"}
                </button>
              )}

              {paymentMethod === "GOOGLE_PAY" && (
                <button
                  onClick={handleGooglePay}
                  disabled={loading}
                  className="w-full rounded-xl bg-white px-6 py-4 font-bold text-gray-900 transition-all hover:scale-105 disabled:opacity-50"
                >
                  {loading ? "Processing..." : "🔵 Pay with Google Pay"}
                </button>
              )}
            </div>
          )}

          {error && (
            <div className="mt-6 animate-pulse rounded-xl border border-red-500/50 bg-red-900/20 p-4 text-red-300 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <span className="text-xl">⚠️</span>
                <div>
                  <div className="font-bold">Error</div>
                  <div className="text-sm">{error}</div>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="mt-6 animate-pulse rounded-xl border border-green-500/50 bg-green-900/20 p-4 text-green-300 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <span className="text-xl">✅</span>
                <div>
                  <div className="font-bold">Success!</div>
                  <div className="text-sm">{success}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-900/20 to-pink-900/20 p-6 backdrop-blur-sm">
          <h3 className="mb-4 text-lg font-black text-white">🔒 Secure Payment</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex items-center gap-2">
              <span className="text-purple-400">✓</span> PCI-DSS compliant tokenization
            </li>
            <li className="flex items-center gap-2">
              <span className="text-purple-400">✓</span> No card data stored on our servers
            </li>
            <li className="flex items-center gap-2">
              <span className="text-purple-400">✓</span> Instant wallet credit after payment
            </li>
            <li className="flex items-center gap-2">
              <span className="text-purple-400">✓</span> 24/7 customer support available
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
