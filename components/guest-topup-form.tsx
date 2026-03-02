"use client";

import { useState } from "react";

export function GuestTopupForm({ clientKey, apiLoginId }: { clientKey: string; apiLoginId: string }) {
  const [amount, setAmount] = useState(10);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [cardCode, setCardCode] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!window.Accept) {
      setStatus("Accept.js not loaded.");
      return;
    }
    if (!firstName || !lastName || !email) {
      setStatus("Please fill first name, last name, and email.");
      return;
    }

    setBusy(true);
    window.Accept.dispatchData(
      {
        authData: { clientKey, apiLoginID: apiLoginId },
        cardData: { cardNumber, month, year, cardCode },
      },
      async (response) => {
        try {
          if (response.messages.resultCode !== "Ok" || !response.opaqueData) {
            setStatus("Card tokenization failed.");
            return;
          }

          const res = await fetch("/api/wallet/guest-recharge/initiate", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              amountCents: Math.round(amount * 100),
              firstName,
              lastName,
              email,
              opaqueDataValue: response.opaqueData.dataValue,
              opaqueDataDescriptor: response.opaqueData.dataDescriptor,
              idempotencyKey: crypto.randomUUID(),
            }),
          });

          const body = (await res.json()) as { success?: boolean };
          setStatus(
            body.success
              ? "Top-up received. We will process and deliver confirmation to your email."
              : "Top-up request failed. Please retry.",
          );
        } finally {
          setBusy(false);
        }
      },
    );
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-white/50 bg-white/90 p-6 shadow-2xl backdrop-blur sm:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-zinc-900 sm:text-3xl">Top Up Balance</h1>
        <p className="mt-1 text-sm text-zinc-600">Secure payment form</p>
      </div>

      <div className="grid gap-4">
        <label className="grid gap-1">
          <span className="text-sm font-medium text-zinc-700">Amount (USD)</span>
          <input
            className="rounded-xl border border-zinc-200 bg-white px-4 py-3 outline-none ring-indigo-500 transition focus:ring-2"
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            placeholder="10"
          />
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-sm font-medium text-zinc-700">First name</span>
            <input
              className="rounded-xl border border-zinc-200 bg-white px-4 py-3 outline-none ring-indigo-500 transition focus:ring-2"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="John"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium text-zinc-700">Last name</span>
            <input
              className="rounded-xl border border-zinc-200 bg-white px-4 py-3 outline-none ring-indigo-500 transition focus:ring-2"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Doe"
            />
          </label>
        </div>

        <label className="grid gap-1">
          <span className="text-sm font-medium text-zinc-700">Email</span>
          <input
            className="rounded-xl border border-zinc-200 bg-white px-4 py-3 outline-none ring-indigo-500 transition focus:ring-2"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm font-medium text-zinc-700">Card number</span>
          <input
            className="rounded-xl border border-zinc-200 bg-white px-4 py-3 outline-none ring-indigo-500 transition focus:ring-2"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            placeholder="4111 1111 1111 1111"
          />
        </label>

        <div className="grid grid-cols-3 gap-3">
          <label className="grid gap-1">
            <span className="text-sm font-medium text-zinc-700">MM</span>
            <input
              className="rounded-xl border border-zinc-200 bg-white px-4 py-3 outline-none ring-indigo-500 transition focus:ring-2"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              placeholder="12"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium text-zinc-700">YYYY</span>
            <input
              className="rounded-xl border border-zinc-200 bg-white px-4 py-3 outline-none ring-indigo-500 transition focus:ring-2"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="2030"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium text-zinc-700">CVV</span>
            <input
              className="rounded-xl border border-zinc-200 bg-white px-4 py-3 outline-none ring-indigo-500 transition focus:ring-2"
              value={cardCode}
              onChange={(e) => setCardCode(e.target.value)}
              placeholder="123"
            />
          </label>
        </div>
      </div>

      <button
        className="mt-6 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 font-semibold text-white transition hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60"
        onClick={submit}
        disabled={busy}
      >
        {busy ? "Processing..." : "Top Up Now"}
      </button>

      {status ? <p className="mt-4 rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-700">{status}</p> : null}
    </div>
  );
}
