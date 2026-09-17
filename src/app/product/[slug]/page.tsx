"use client";

import { useState, use } from "react";
import { notFound, useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StoreShell } from "@/components/store-shell";
import { money, priceFor } from "@/lib/catalog";
import { useLiveCatalog } from "@/lib/useLiveCatalog";
import { useCart } from "@/components/cart-context";

export default function Product({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const { products, loading } = useLiveCatalog();
    const product = products.find((x) => x.slug === slug);
    const p = product!; // Safe because we early return below
    const cart = useCart();
    const inCart = cart.items.reduce((acc, i) => i.product.id === p?.id ? acc + i.quantity : acc, 0);
    const router = useRouter();
    const [weight, setWeight] = useState(250);
    const [qty, setQty] = useState(1);

    if (!product) {
        if (loading) return null;
        notFound();
        return null;
    }

    return (
        <StoreShell>
            <section className="grid min-h-[calc(100vh-5rem)] lg:grid-cols-[58%_42%]">
                <div className="bg-secondary">
                    <img
                        src={(p.image as any).src || p.image}
                        alt={`${p.name} in Veloiz packaging`}
                        width={1200}
                        height={1504}
                        className="h-full max-h-[900px] w-full object-cover"
                    />
                </div>
                <div className="flex items-center px-5 py-14 md:px-14">
                    <div className="max-w-lg">
                        <p className="text-xs uppercase tracking-[.2em]">{p.category}</p>
                        <h1 className="mt-3 text-6xl leading-[.9] md:text-7xl">{p.name}</h1>
                        <p className="mt-6 text-lg leading-8 text-ink-soft">{p.short}</p>
                        <p className="mt-7 font-display text-4xl">{money(priceFor(p, weight))}</p>
                        <div className="mt-10">
                            <p className="mb-3 text-xs uppercase tracking-[.16em]">Choose weight</p>
                            <div className="grid grid-cols-3 border editorial-rule">
                                {[250, 500, 1000].map((w) => (
                                    <button
                                        key={w}
                                        onClick={() => setWeight(w)}
                                        className={`h-14 border-r editorial-rule text-sm last:border-r-0 ${weight === w ? "bg-accent text-accent-foreground" : "hover:bg-secondary"
                                            }`}
                                    >
                                        {w === 1000 ? "1kg" : `${w}g`}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="mt-7 flex h-14 w-40 items-center justify-between border editorial-rule px-2">
                            <Button size="icon" variant="ghost" onClick={() => setQty(Math.max(1, qty - 1))}>
                                <Minus />
                            </Button>
                            <span>{qty}</span>
                            <Button size="icon" variant="ghost" onClick={() => setQty(qty + 1)}>
                                <Plus />
                            </Button>
                        </div>
                        {((p.stocks?.[weight] ?? p.stock) > 0 && (p.stocks?.[weight] ?? p.stock) <= 8) && (
                            <p className="mt-5 text-sm text-primary">
                                <span className="mr-2 inline-block h-2 w-2 rounded-full bg-primary animate-pulse" />
                                Only {p.stocks?.[weight] ?? p.stock} packs available in {weight === 1000 ? "1kg" : `${weight}g`}
                            </p>
                        )}
                        {(p.stocks?.[weight] ?? p.stock) <= 0 && (
                            <p className="mt-5 text-sm text-muted-foreground bg-secondary px-3 py-1.5 w-fit rounded-md uppercase tracking-[.1em]">
                                Out of stock
                            </p>
                        )}
                        <div className="mt-8 grid gap-3 sm:grid-cols-2">
                            <Button size="lg" variant="ink" className="h-14" disabled={(p.stocks?.[weight] ?? p.stock) <= 0} onClick={() => cart.add(p, weight, qty)}>
                                {(p.stocks?.[weight] ?? p.stock) <= 0 ? "Unavailable" : "Add to cart"}
                            </Button>
                            <Button
                                size="lg"
                                variant="quiet"
                                className="h-14"
                                disabled={(p.stocks?.[weight] ?? p.stock) <= 0}
                                onClick={() => {
                                    cart.add(p, weight, qty);
                                    cart.setOpen(false);
                                    router.push("/checkout");
                                }}
                            >
                                Buy now
                            </Button>
                        </div>
                        <div className="mt-10 border-t editorial-rule pt-7">
                            <h2 className="font-display text-2xl">Why this batch</h2>
                            <p className="mt-3 leading-7 text-muted-foreground">{p.long}</p>
                        </div>
                    </div>
                </div>
            </section>
        </StoreShell>
    );
}
