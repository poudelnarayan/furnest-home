import { create } from "zustand";

type CartItem = {
  productId: string;
  name: string;
  priceCents: number;
  quantity: number;
};

type CartStore = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
};

export const useCartStore = create<CartStore>((set) => ({
  items: [],
  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((x) => x.productId === item.productId);
      if (existing) {
        return {
          items: state.items.map((x) =>
            x.productId === item.productId ? { ...x, quantity: x.quantity + item.quantity } : x,
          ),
        };
      }
      return { items: [...state.items, item] };
    }),
  removeItem: (productId) =>
    set((state) => ({ items: state.items.filter((item) => item.productId !== productId) })),
  clear: () => set({ items: [] }),
}));
