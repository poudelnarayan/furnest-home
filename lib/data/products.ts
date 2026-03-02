export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  type: "digital" | "physical";
  priceCents: number;
  image: string;
  description: string;
  badge?: string;
};

export const products: Product[] = [
  {
    id: "ff-100",
    slug: "free-fire-100-diamonds",
    name: "Free Fire 100 Diamonds",
    category: "Free Fire",
    type: "digital",
    priceCents: 199,
    image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&q=80&auto=format&fit=crop",
    description: "Instant in-game top-up for Free Fire.",
    badge: "Instant",
  },
  {
    id: "ff-530",
    slug: "free-fire-530-diamonds",
    name: "Free Fire 530 Diamonds",
    category: "Free Fire",
    type: "digital",
    priceCents: 799,
    image: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=1200&q=80&auto=format&fit=crop",
    description: "Best value bundle for active players.",
    badge: "Popular",
  },
  {
    id: "pubg-325",
    slug: "pubg-325-uc",
    name: "PUBG 325 UC",
    category: "PUBG",
    type: "digital",
    priceCents: 499,
    image: "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=1200&q=80&auto=format&fit=crop",
    description: "Fast and secure PUBG UC recharge.",
    badge: "Top-up",
  },
  {
    id: "tt-700",
    slug: "tiktok-700-coins",
    name: "TikTok 700 Coins",
    category: "TikTok",
    type: "digital",
    priceCents: 899,
    image: "https://images.unsplash.com/photo-1611605698335-8b1569810432?w=1200&q=80&auto=format&fit=crop",
    description: "Recharge TikTok coins directly and safely.",
    badge: "Trending",
  },
  {
    id: "acc-rgb",
    slug: "rgb-gaming-mouse",
    name: "RGB Gaming Mouse",
    category: "Accessories",
    type: "physical",
    priceCents: 2999,
    image: "https://images.unsplash.com/photo-1613141412501-9012977f1969?w=1200&q=80&auto=format&fit=crop",
    description: "High-precision gaming mouse with RGB modes.",
    badge: "Physical",
  },
  {
    id: "gift-25",
    slug: "digital-gift-card-25",
    name: "Digital Gift Card $25",
    category: "Digital",
    type: "digital",
    priceCents: 2500,
    image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&q=80&auto=format&fit=crop",
    description: "Redeemable gift card delivered via email.",
    badge: "Gift",
  },
];

export const featuredProducts = products.slice(0, 4);

export function formatUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}
