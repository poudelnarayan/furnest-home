import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { getCatalogProducts } from "@/lib/data/catalog";

export default async function Home() {
  const products = await getCatalogProducts();
  const featured = products.slice(0, 8);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-pink-600 px-6 py-12 text-white sm:px-10">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-white/80">Game top-up platform</p>
            <h1 className="mt-3 text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
              Buy top-ups, gift cards, and accessories in one place
            </h1>
            <p className="mt-4 max-w-2xl text-white/90">
              Secure wallet recharge, fast checkout, instant digital delivery, and reliable support for gaming shoppers.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/products" className="rounded-full bg-white px-5 py-2.5 font-semibold text-indigo-700 hover:bg-zinc-100">
                Shop now
              </Link>
              <Link href="/wallet/trax" className="rounded-full border border-white/50 px-5 py-2.5 font-semibold text-white hover:bg-white/10">
                Guest wallet top-up
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 rounded-2xl bg-white/10 p-3 backdrop-blur">
            {[
              ["5M+", "Trusted users"],
              ["24/7", "Live support"],
              ["Instant", "Digital delivery"],
              ["Secure", "Tokenized payment"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-xl bg-white/15 p-4 text-center">
                <p className="text-2xl font-extrabold">{value}</p>
                <p className="text-sm text-white/85">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-3">
        {[
          ["Free Fire", "Diamonds & passes with instant fulfillment", "from-rose-500 to-pink-500"],
          ["PUBG UC", "Daily deals, bundle pricing, secure checkout", "from-emerald-500 to-green-500"],
          ["TikTok Coins", "Fast recharge with email confirmation", "from-cyan-500 to-blue-500"],
        ].map(([title, desc, grad]) => (
          <article key={title} className={`rounded-2xl bg-gradient-to-r ${grad} p-5 text-white`}>
            <h3 className="text-xl font-bold">{title}</h3>
            <p className="mt-2 text-sm text-white/90">{desc}</p>
          </article>
        ))}
      </section>

      <section className="mt-12">
        <div className="mb-5 flex items-end justify-between">
          <h2 className="text-2xl font-extrabold text-zinc-900">Featured Products</h2>
          <Link href="/products" className="text-sm font-semibold text-indigo-600">
            View all
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="mt-14 grid gap-8 lg:grid-cols-2">
        <article className="rounded-2xl border bg-white p-6">
          <h3 className="text-2xl font-bold text-zinc-900">Why gamers choose us</h3>
          <ul className="mt-4 grid gap-3 text-sm text-zinc-700">
            <li>• Secure card tokenization with Authorize.net Accept.js</li>
            <li>• Wallet top-up and direct guest payment support</li>
            <li>• Instant delivery for supported digital products</li>
            <li>• Manual + automated fulfillment architecture ready</li>
            <li>• Transparent order statuses and transaction history</li>
          </ul>
        </article>

        <article className="rounded-2xl border bg-white p-6">
          <h3 className="text-2xl font-bold text-zinc-900">Customer stories</h3>
          <div className="mt-4 grid gap-3 text-sm text-zinc-700">
            <blockquote className="rounded-lg bg-zinc-50 p-3">“Fast UC top-up. Order came in under a minute.”</blockquote>
            <blockquote className="rounded-lg bg-zinc-50 p-3">“Guest top-up flow is super smooth and trustworthy.”</blockquote>
            <blockquote className="rounded-lg bg-zinc-50 p-3">“Support team resolved my failed payment quickly.”</blockquote>
          </div>
        </article>
      </section>

      <section className="mt-14 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-900 p-8 text-white">
        <h3 className="text-3xl font-extrabold">Start shopping today</h3>
        <p className="mt-2 max-w-2xl text-white/85">
          Browse products, add to cart, or use guest wallet top-up to load balance without account creation.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/products" className="rounded-full bg-white px-5 py-2.5 font-semibold text-indigo-700">
            Browse catalog
          </Link>
          <Link href="/auth/register" className="rounded-full border border-white/50 px-5 py-2.5 font-semibold text-white">
            Create account
          </Link>
        </div>
      </section>
    </main>
  );
}
