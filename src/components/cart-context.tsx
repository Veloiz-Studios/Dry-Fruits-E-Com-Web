"use client";
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { priceFor, type Product } from "@/lib/catalog";

export type CartItem = { product: Product; weight: number; quantity: number };
type CartValue = { items: CartItem[]; open: boolean; setOpen: (v: boolean) => void; add: (p: Product, w: number, q: number) => void; change: (id: string, w: number, q: number) => void; remove: (id: string, w: number) => void; count: number; subtotal: number; clear: () => void };
const CartContext = createContext<CartValue | undefined>(undefined);
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]); const [open, setOpen] = useState(false);
  const value = useMemo<CartValue>(() => ({ items, open, setOpen, add: (product, weight, quantity) => { setItems(old => { const found = old.find(x => x.product.id === product.id && x.weight === weight); return found ? old.map(x => x === found ? { ...x, quantity: x.quantity + quantity } : x) : [...old, { product, weight, quantity }] }); setOpen(true) }, change: (id, w, q) => setItems(old => old.map(x => x.product.id === id && x.weight === w ? { ...x, quantity: Math.max(1, q) } : x)), remove: (id, w) => setItems(old => old.filter(x => !(x.product.id === id && x.weight === w))), count: items.reduce((a, x) => a + x.quantity, 0), subtotal: items.reduce((a, x) => a + priceFor(x.product, x.weight) * x.quantity, 0), clear: () => setItems([]) }), [items, open]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
export function useCart() { const value = useContext(CartContext); if (!value) throw new Error("Cart unavailable"); return value }