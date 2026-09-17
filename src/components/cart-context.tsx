"use client";
import { createContext, useContext, useMemo, useState, useEffect, type ReactNode } from "react";
import { toast } from "sonner";
import { priceFor, type Product } from "@/lib/catalog";

export type CartItem = { product: Product; weight: number; quantity: number };
type CartValue = { items: CartItem[]; open: boolean; setOpen: (v: boolean) => void; add: (p: Product, w: number, q: number) => void; change: (id: string, w: number, q: number) => void; remove: (id: string, w: number) => void; count: number; subtotal: number; clear: () => void };

const CartContext = createContext<CartValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initial hydration from local storage
  useEffect(() => {
    try {
      const savedData = localStorage.getItem("veloiz-cart");
      if (savedData) setItems(JSON.parse(savedData));
    } catch { } // Ignore JSON parse errors silently
    setIsLoaded(true);
  }, []);

  // Persist to local storage automatically on any cart mutation
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("veloiz-cart", JSON.stringify(items));
    }
  }, [items, isLoaded]);

  const value = useMemo<CartValue>(() => ({
    items,
    open,
    setOpen,
    add: (product, weight, quantity) => {
      let limitReached = false;
      setItems(old => {
        const found = old.find(x => x.product.id === product.id && x.weight === weight);
        const nextQ = found ? found.quantity + quantity : quantity;
        if (nextQ > product.stock) {
          limitReached = true;
          // Cap at max stock
          return found ? old.map(x => x === found ? { ...x, quantity: product.stock } : x) : [...old, { product, weight, quantity: product.stock }];
        }
        return found ? old.map(x => x === found ? { ...x, quantity: nextQ } : x) : [...old, { product, weight, quantity }];
      });
      setOpen(true);
      if (limitReached) setTimeout(() => toast.error(`Only ${product.stock} packs left in stock!`), 100);
    },
    change: (id, w, q) => {
      let limitReached = false;
      setItems(old => {
        const maxStock = old.find(x => x.product.id === id)?.product.stock ?? 99;
        const safeQ = q > maxStock ? maxStock : Math.max(1, q);
        if (q > maxStock) limitReached = true;
        return old.map(x => x.product.id === id && x.weight === w ? { ...x, quantity: safeQ } : x);
      });
      if (limitReached) setTimeout(() => toast.error("Maximum available stock reached!"), 100);
    },
    remove: (id, w) => setItems(old => old.filter(x => !(x.product.id === id && x.weight === w))),
    count: items.reduce((a, x) => a + x.quantity, 0),
    subtotal: items.reduce((a, x) => a + priceFor(x.product, x.weight) * x.quantity, 0),
    clear: () => setItems([])
  }), [items, open]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("Cart unavailable");
  return value;
}