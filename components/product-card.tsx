"use client";

import { Product, formatUsd } from "@/lib/data/products";
import { useCartStore } from "@/stores/cart.store";

type Props = {
  product: Product;
};

export function ProductCard({ product }: Props) {
  const addItem = useCartStore((state) => state.addItem);

  return (
    <article className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-48 w-full overflow-hidden bg-zinc-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition group-hover:scale-105"
        />
        {product.badge ? (
          <span className="absolute left-3 top-3 rounded-full bg-indigo-600 px-2 py-1 text-xs font-semibold text-white">
            {product.badge}
          </span>
        ) : null}
      </div>

      <div className="p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">{product.category}</p>
        <h3 className="mt-1 text-lg font-bold text-zinc-900">{product.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-zinc-600">{product.description}</p>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-lg font-extrabold text-zinc-900">{formatUsd(product.priceCents)}</p>
          <button
            className="rounded-full bg-pink-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-pink-500"
            onClick={() =>
              addItem({
                productId: product.id,
                name: product.name,
                priceCents: product.priceCents,
                quantity: 1,
              })
            }
          >
            Add to cart
          </button>
        </div>
      </div>
    </article>
  );
}
