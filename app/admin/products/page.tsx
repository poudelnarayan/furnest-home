"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { formatUsd } from "@/lib/data/products";

type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  unitPriceCents: string;
  type: "DIGITAL_INSTANT" | "DIGITAL_MANUAL" | "PHYSICAL" | "TOPUP";
  active: boolean;
  category: { id: string; name: string; slug: string };
  metadata?: { image?: string; badge?: string };
};

type NewProductForm = {
  name: string;
  category: string;
  description: string;
  priceCents: string;
  type: "digital" | "physical";
  image: string;
  badge: string;
  active: boolean;
};

const initialForm: NewProductForm = {
  name: "",
  category: "",
  description: "",
  priceCents: "",
  type: "digital",
  image: "",
  badge: "",
  active: true,
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [form, setForm] = useState<NewProductForm>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const editingProduct = useMemo(
    () => products.find((p) => p.id === editingId) ?? null,
    [products, editingId],
  );

  const loadProducts = async () => {
    const res = await fetch("/api/admin/products", { method: "GET" });
    const body = (await res.json()) as {
      success?: boolean;
      data?: { products?: AdminProduct[] };
      error?: { message?: string };
    };

    if (body.success && body.data?.products) {
      setProducts(body.data.products);
      setStatus("");
    } else {
      setStatus(body.error?.message ?? "Failed to load admin products. Login as admin.");
    }
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const res = await fetch("/api/admin/products", { method: "GET" });
      const body = (await res.json()) as {
        success?: boolean;
        data?: { products?: AdminProduct[] };
        error?: { message?: string };
      };

      if (cancelled) return;

      if (body.success && body.data?.products) {
        setProducts(body.data.products);
        setStatus("");
      } else {
        setStatus(body.error?.message ?? "Failed to load admin products. Login as admin.");
      }
      setLoading(false);
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const createProduct = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...form,
        priceCents: Number(form.priceCents),
      }),
    });

    const body = (await res.json()) as { success?: boolean; error?: { message?: string } };
    if (!body.success) {
      setStatus(body.error?.message ?? "Failed to add product.");
      return;
    }

    setStatus("Product added successfully.");
    setForm(initialForm);
    await loadProducts();
  };

  const updateQuickPrice = async (productId: string, priceCents: number) => {
    const res = await fetch(`/api/admin/products/${productId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ priceCents }),
    });

    const body = (await res.json()) as { success?: boolean; error?: { message?: string } };
    if (!body.success) {
      setStatus(body.error?.message ?? "Failed to update price.");
      return;
    }

    setStatus("Price updated.");
    await loadProducts();
  };

  const saveEdit = async () => {
    if (!editingProduct) return;

    const res = await fetch(`/api/admin/products/${editingProduct.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: editingProduct.name,
        category: editingProduct.category.name,
        description: editingProduct.description,
        priceCents: Number(editingProduct.unitPriceCents),
        type: editingProduct.type === "PHYSICAL" ? "physical" : "digital",
        image: editingProduct.metadata?.image,
        badge: editingProduct.metadata?.badge,
        active: editingProduct.active,
      }),
    });

    const body = (await res.json()) as { success?: boolean; error?: { message?: string } };
    if (!body.success) {
      setStatus(body.error?.message ?? "Failed to save product.");
      return;
    }

    setStatus("Product updated.");
    setEditingId(null);
    await loadProducts();
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8">
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-900 p-6 text-white">
        <h1 className="text-3xl font-extrabold">Admin Product Panel</h1>
        <p className="mt-2 text-white/80">
          Add products, edit product details, and update prices from one place.
        </p>
      </div>

      {status ? <p className="mt-4 rounded-lg bg-indigo-50 p-3 text-sm text-indigo-700">{status}</p> : null}

      <section className="mt-8 grid gap-6 lg:grid-cols-3">
        <form className="rounded-2xl border bg-white p-5 lg:col-span-1" onSubmit={createProduct}>
          <h2 className="text-lg font-bold">Add Product</h2>
          <div className="mt-4 grid gap-2">
            <input
              className="rounded border px-3 py-2"
              placeholder="Product name"
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
            />
            <input
              className="rounded border px-3 py-2"
              placeholder="Category"
              value={form.category}
              onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))}
            />
            <textarea
              className="rounded border px-3 py-2"
              placeholder="Description"
              rows={4}
              value={form.description}
              onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
            />
            <input
              className="rounded border px-3 py-2"
              type="number"
              placeholder="Price cents (e.g. 799)"
              value={form.priceCents}
              onChange={(e) => setForm((s) => ({ ...s, priceCents: e.target.value }))}
            />
            <select
              className="rounded border px-3 py-2"
              value={form.type}
              onChange={(e) => setForm((s) => ({ ...s, type: e.target.value as "digital" | "physical" }))}
            >
              <option value="digital">Digital</option>
              <option value="physical">Physical</option>
            </select>
            <input
              className="rounded border px-3 py-2"
              placeholder="Image URL"
              value={form.image}
              onChange={(e) => setForm((s) => ({ ...s, image: e.target.value }))}
            />
            <input
              className="rounded border px-3 py-2"
              placeholder="Badge (optional)"
              value={form.badge}
              onChange={(e) => setForm((s) => ({ ...s, badge: e.target.value }))}
            />
          </div>
          <button className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-500" type="submit">
            Add Product
          </button>
        </form>

        <div className="rounded-2xl border bg-white p-5 lg:col-span-2">
          <h2 className="text-lg font-bold">Manage Products</h2>
          {loading ? <p className="mt-3 text-sm text-zinc-600">Loading...</p> : null}
          <div className="mt-4 grid gap-3">
            {products.map((product) => {
              const cents = Number(product.unitPriceCents);
              const isEditing = editingId === product.id;

              return (
                <article key={product.id} className="rounded-xl border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{product.name}</p>
                      <p className="text-sm text-zinc-500">
                        {product.category.name} • {product.type} • {product.active ? "Active" : "Inactive"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{formatUsd(cents)}</span>
                      <button
                        className="rounded border px-3 py-1 text-sm hover:bg-zinc-50"
                        onClick={() => {
                          const next = window.prompt("Enter new price in cents", String(cents));
                          if (!next) return;
                          const parsed = Number(next);
                          if (!Number.isFinite(parsed) || parsed <= 0) return;
                          void updateQuickPrice(product.id, parsed);
                        }}
                      >
                        Update price
                      </button>
                      <button
                        className="rounded bg-zinc-900 px-3 py-1 text-sm text-white"
                        onClick={() => setEditingId(isEditing ? null : product.id)}
                      >
                        {isEditing ? "Close" : "Edit"}
                      </button>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="mt-4 grid gap-2 rounded-lg bg-zinc-50 p-3">
                      <input
                        className="rounded border px-3 py-2"
                        value={editingProduct?.name ?? ""}
                        onChange={(e) =>
                          setProducts((prev) =>
                            prev.map((p) => (p.id === product.id ? { ...p, name: e.target.value } : p)),
                          )
                        }
                      />
                      <textarea
                        className="rounded border px-3 py-2"
                        rows={3}
                        value={editingProduct?.description ?? ""}
                        onChange={(e) =>
                          setProducts((prev) =>
                            prev.map((p) => (p.id === product.id ? { ...p, description: e.target.value } : p)),
                          )
                        }
                      />
                      <input
                        className="rounded border px-3 py-2"
                        value={editingProduct?.category.name ?? ""}
                        onChange={(e) =>
                          setProducts((prev) =>
                            prev.map((p) =>
                              p.id === product.id ? { ...p, category: { ...p.category, name: e.target.value } } : p,
                            ),
                          )
                        }
                      />
                      <button
                        className="mt-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
                        onClick={saveEdit}
                      >
                        Save changes
                      </button>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
