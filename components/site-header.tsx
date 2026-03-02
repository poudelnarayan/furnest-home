"use client";

import Link from "next/link";
import { useCartStore } from "@/stores/cart.store";

export function SiteHeader() {
  const items = useCartStore((state) => state.items);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-20 border-b border-white/30 bg-white/80 backdrop-blur-lg">
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-extrabold text-indigo-600">
          furnest-home.com
        </Link>

        <div className="flex items-center gap-4 text-sm font-medium">
          <Link href="/" className="text-zinc-700 transition hover:text-indigo-600">
            Home
          </Link>
          <Link href="/products" className="text-zinc-700 transition hover:text-indigo-600">
            Products
          </Link>
          <Link href="/wallet/trax" className="text-zinc-700 transition hover:text-indigo-600">
            Wallet Top-Up
          </Link>
          <Link href="/auth/login" className="text-zinc-700 transition hover:text-indigo-600">
            Login
          </Link>
          <Link href="/auth/register" className="rounded-full bg-indigo-600 px-3 py-1.5 text-white transition hover:bg-indigo-500">
            Register
          </Link>
          <Link href="/cart" className="relative rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-indigo-700">
            Cart
            {totalItems > 0 ? (
              <span className="ml-2 rounded-full bg-pink-600 px-2 py-0.5 text-xs text-white">{totalItems}</span>
            ) : null}
          </Link>
        </div>
      </nav>
    </header>
  );
}
