import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { getCatalogProducts } from "@/lib/data/catalog";

export default async function Home() {
  const products = await getCatalogProducts();
  const featured = products.slice(0, 8);

  return (
    <main className="relative min-h-screen bg-[#0a0a0f]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40"></div>

      <div className="relative mx-auto w-full max-w-7xl px-4 py-16">
        <section className="relative overflow-hidden rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-900/40 via-indigo-900/40 to-pink-900/40 backdrop-blur-xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDE0NywgNTEsIDIzNCwgMC4xKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>

          <div className="relative px-8 py-16 sm:px-12">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-purple-400/30 bg-purple-500/10 px-4 py-2 backdrop-blur-sm">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-purple-400"></div>
                  <span className="text-sm font-semibold uppercase tracking-wider text-purple-200">Live Gaming Platform</span>
                </div>

                <h1 className="text-5xl font-black leading-tight text-white sm:text-6xl lg:text-7xl">
                  <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
                    Level Up
                  </span>
                  <br />
                  Your Game
                </h1>

                <p className="max-w-2xl text-lg text-gray-300">
                  Instant top-ups, secure wallet system, and lightning-fast delivery. Get back to gaming in seconds.
                </p>

                <div className="flex flex-wrap gap-4">
                  <Link
                    href="/wallet/guest"
                    className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 font-bold text-white transition-all hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50"
                  >
                    <span className="relative z-10">Start Top-Up</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 opacity-0 transition-opacity group-hover:opacity-100"></div>
                  </Link>

                  <Link
                    href="/products"
                    className="rounded-xl border-2 border-purple-500/50 bg-purple-500/10 px-8 py-4 font-bold text-white backdrop-blur-sm transition-all hover:border-purple-400 hover:bg-purple-500/20"
                  >
                    Browse Products
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: "5M+", label: "Active Users", icon: "👥" },
                  { value: "<1min", label: "Avg Delivery", icon: "⚡" },
                  { value: "24/7", label: "Support", icon: "💬" },
                  { value: "100%", label: "Secure", icon: "🔒" },
                ].map(({ value, label, icon }) => (
                  <div
                    key={label}
                    className="group relative overflow-hidden rounded-2xl border border-purple-500/20 bg-black/40 p-6 backdrop-blur-sm transition-all hover:border-purple-400/50 hover:bg-black/60"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 to-pink-600/0 opacity-0 transition-opacity group-hover:from-purple-600/10 group-hover:to-pink-600/10 group-hover:opacity-100"></div>
                    <div className="relative space-y-2">
                      <div className="text-3xl">{icon}</div>
                      <p className="text-3xl font-black text-white">{value}</p>
                      <p className="text-sm font-medium text-gray-400">{label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { title: "Free Fire", desc: "Diamonds & Elite Passes", gradient: "from-orange-600 to-red-600", icon: "🔥" },
            { title: "PUBG Mobile", desc: "UC & Battle Passes", gradient: "from-blue-600 to-cyan-600", icon: "🎮" },
            { title: "Mobile Legends", desc: "Diamonds & Skins", gradient: "from-purple-600 to-pink-600", icon: "⚔️" },
          ].map(({ title, desc, gradient, icon }) => (
            <div
              key={title}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-gray-900 to-black p-6 transition-all hover:scale-105 hover:border-white/20"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 transition-opacity group-hover:opacity-20`}></div>
              <div className="relative space-y-3">
                <div className="text-4xl">{icon}</div>
                <h3 className="text-2xl font-black text-white">{title}</h3>
                <p className="text-gray-400">{desc}</p>
                <button className="text-sm font-semibold text-purple-400 transition-colors hover:text-purple-300">
                  View Options →
                </button>
              </div>
            </div>
          ))}
        </section>

        <section className="mt-16">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-4xl font-black text-white">Featured Products</h2>
              <p className="mt-2 text-gray-400">Instant delivery guaranteed</p>
            </div>
            <Link href="/products" className="text-sm font-bold text-purple-400 transition-colors hover:text-purple-300">
              View All →
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        <section className="mt-20 grid gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-900/20 to-pink-900/20 p-8 backdrop-blur-sm">
            <h3 className="text-3xl font-black text-white">Why Choose Us</h3>
            <ul className="mt-6 space-y-4">
              {[
                "Instant delivery for digital products",
                "Secure payment with Accept.js tokenization",
                "Guest wallet - no registration required",
                "Apple Pay, Google Pay, Cards supported",
                "24/7 customer support",
                "Transparent transaction history",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-gray-300">
                  <span className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-purple-500/20 text-xs text-purple-400">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-indigo-900/20 to-purple-900/20 p-8 backdrop-blur-sm">
            <h3 className="text-3xl font-black text-white">Player Reviews</h3>
            <div className="mt-6 space-y-4">
              {[
                { text: "Fastest UC delivery I've ever experienced!", rating: 5 },
                { text: "Guest wallet is super convenient. No signup needed!", rating: 5 },
                { text: "Great support team. Resolved my issue in minutes.", rating: 5 },
              ].map((review, idx) => (
                <div key={idx} className="rounded-xl border border-white/5 bg-black/30 p-4">
                  <div className="mb-2 flex gap-1">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <span key={i} className="text-yellow-400">★</span>
                    ))}
                  </div>
                  <p className="text-sm text-gray-300">{review.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-20 overflow-hidden rounded-3xl border border-purple-500/30 bg-gradient-to-r from-purple-900/50 via-pink-900/50 to-purple-900/50 p-12 text-center backdrop-blur-xl">
          <h3 className="text-5xl font-black text-white">Ready to Play?</h3>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-300">
            Join millions of gamers. Top up your account in seconds and get back to winning.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/wallet/guest"
              className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-10 py-4 text-lg font-bold text-white transition-all hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50"
            >
              Top Up Now
            </Link>
            <Link
              href="/auth/register"
              className="rounded-xl border-2 border-white/20 bg-white/5 px-10 py-4 text-lg font-bold text-white backdrop-blur-sm transition-all hover:bg-white/10"
            >
              Create Account
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
