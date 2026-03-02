import { ProductCard } from "@/components/product-card";
import { getCatalogProducts } from "@/lib/data/catalog";

export default async function ProductsPage() {
  const products = await getCatalogProducts();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="mb-8 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 p-6 text-white">
        <h1 className="text-3xl font-extrabold">Explore Products</h1>
        <p className="mt-2 text-white/90">
          Free Fire Diamonds, PUBG UC, TikTok Coins, digital goods, and physical accessories.
        </p>
      </div>

      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </section>
    </main>
  );
}
