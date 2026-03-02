"use client";

import Link from "next/link";
import { formatUsd } from "@/lib/data/products";
import { useCartStore } from "@/stores/cart.store";

export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const clear = useCartStore((state) => state.clear);

  const subtotalCents = items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8">
      <section className="rounded-[2rem] bg-gradient-to-r from-indigo-700 via-violet-700 to-fuchsia-700 p-[1px] shadow-xl">
        <div className="rounded-[calc(2rem-1px)] bg-white/95 p-8 backdrop-blur">
          <h1 className="text-4xl font-extrabold text-zinc-900">Your Cart</h1>
          <p className="mt-2 text-zinc-600">Everything you selected is here. Ready when you are.</p>
        </div>
      </section>

      {items.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-zinc-300 bg-white p-14 text-center shadow-sm">
          <p className="text-zinc-500">Your cart is currently empty.</p>
          <Link
            href="/products"
            className="mt-6 inline-flex rounded-full bg-gradient-to-r from-indigo-600 to-pink-600 px-6 py-2.5 font-semibold text-white"
          >
            Browse products
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
            {items.map((item) => (
              <div
                key={item.productId}
                className="flex items-center justify-between gap-4 border-b border-zinc-100 p-6 last:border-b-0"
              >
                <div>
                  <p className="text-lg font-bold text-zinc-900">{item.name}</p>
                  <p className="mt-1 text-sm text-zinc-500">
                    Qty {item.quantity} • {formatUsd(item.priceCents)} each
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-extrabold text-zinc-900">{formatUsd(item.priceCents * item.quantity)}</p>
                  <button
                    className="mt-2 rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                    onClick={() => removeItem(item.productId)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <aside className="h-fit rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-extrabold text-zinc-900">Order Summary</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between text-zinc-600">
                <span>Items</span>
                <span>{items.length}</span>
              </div>
              <div className="flex items-center justify-between text-zinc-600">
                <span>Subtotal</span>
                <span>{formatUsd(subtotalCents)}</span>
              </div>
              <div className="flex items-center justify-between text-zinc-600">
                <span>Estimated tax</span>
                <span>{formatUsd(0)}</span>
              </div>
              <div className="border-t pt-3 text-base font-bold text-zinc-900">
                <div className="flex items-center justify-between">
                  <span>Total</span>
                  <span>{formatUsd(subtotalCents)}</span>
                </div>
              </div>
            </div>
            <button className="mt-6 w-full rounded-xl bg-gradient-to-r from-zinc-900 to-indigo-900 py-3 font-semibold text-white transition hover:from-zinc-800 hover:to-indigo-800">
              Proceed to checkout
            </button>
            <button
              className="mt-3 w-full rounded-xl border border-zinc-300 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
              onClick={clear}
            >
              Clear cart
            </button>
          </aside>
        </div>
      )}
    </main>
  );
}
