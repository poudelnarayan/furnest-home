"use client";

import { useState } from "react";

export function WalletRechargeForm({ clientKey, apiLoginId }: { clientKey: string; apiLoginId: string }) {
  const [amount, setAmount] = useState(10);
  const [status, setStatus] = useState<string>("");
  const [cardNumber, setCardNumber] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [cardCode, setCardCode] = useState("");

  const submit = async () => {
    if (!window.Accept) {
      setStatus("Accept.js is not loaded");
      return;
    }

    window.Accept.dispatchData(
      {
        authData: { clientKey, apiLoginID: apiLoginId },
        cardData: {
          cardNumber,
          month,
          year,
          cardCode,
        },
      },
      async (response) => {
        if (response.messages.resultCode !== "Ok" || !response.opaqueData) {
          setStatus("Tokenization failed");
          return;
        }

        const res = await fetch("/api/wallet/recharge/initiate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            amountCents: Math.round(amount * 100),
            opaqueDataValue: response.opaqueData.dataValue,
            opaqueDataDescriptor: response.opaqueData.dataDescriptor,
            idempotencyKey: crypto.randomUUID(),
          }),
        });

        const body = (await res.json()) as { success?: boolean };
        setStatus(body.success ? "Recharge submitted. Awaiting webhook settlement." : "Recharge failed.");
      },
    );
  };

  return (
    <div className="rounded-lg border p-4">
      <h3 className="font-semibold">Wallet Recharge</h3>
      <p className="text-sm text-zinc-500">Card data is tokenized by Accept.js and never hits your server.</p>
      <div className="mt-4 flex items-center gap-2">
        <input
          className="rounded border px-3 py-2"
          type="number"
          min={1}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
        />
      </div>
      <div className="mt-3 grid gap-2">
        <input
          className="rounded border px-3 py-2"
          placeholder="Card number"
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value)}
        />
        <div className="grid grid-cols-3 gap-2">
          <input
            className="rounded border px-3 py-2"
            placeholder="MM"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
          <input
            className="rounded border px-3 py-2"
            placeholder="YYYY"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          />
          <input
            className="rounded border px-3 py-2"
            placeholder="CVV"
            value={cardCode}
            onChange={(e) => setCardCode(e.target.value)}
          />
        </div>
      </div>
      <button className="mt-3 rounded bg-black px-4 py-2 text-white" onClick={submit}>
        Recharge
      </button>
      {status ? <p className="mt-3 text-sm">{status}</p> : null}
    </div>
  );
}
