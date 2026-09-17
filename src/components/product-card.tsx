"use client";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart-context";
import { money, priceFor, type Product } from "@/lib/catalog";

export function ProductCard({ product }: { product: Product }) {
    const cart = useCart();
    const oos = product.stock <= 0;

    return (
        <article className="group flex flex-col relative w-full pt-1">
            <Link href={`/product/${product.slug}`} className="block overflow-hidden bg-secondary relative">
                <img
                    src={(product.image as any).src || product.image}
                    alt={`${product.name} in Veloiz packaging`}
                    loading="lazy"
                    width={1200}
                    height={1504}
                    className={`aspect-[4/5] w-full object-cover transition-all duration-700 ease-[cubic-bezier(0.33,1,0.68,1)] ${oos ? 'opacity-50 grayscale' : 'group-hover:scale-110'}`}
                />
                <div className="absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/10 pointer-events-none" />
            </Link>
            <div className="grid flex-1 grid-cols-[1fr_auto] gap-3 pt-5">
                <div>
                    <p className="text-[10px] sm:text-xs uppercase tracking-widest text-muted-foreground transition-all duration-300 group-hover:translate-x-1 group-hover:text-foreground">
                        {product.category}
                    </p>
                    <Link href={`/product/${product.slug}`} className="relative mt-2 inline-block font-display text-2xl md:text-3xl lg:text-[1.7rem] transition-colors duration-300 group-hover:text-primary">
                        {product.name}
                        <span className="absolute -bottom-1 left-0 h-[1.5px] w-0 bg-primary transition-all duration-500 ease-out group-hover:w-full" />
                    </Link>
                    <p className={`mt-3 font-medium transition-colors duration-300 ${oos ? 'text-muted-foreground line-through' : 'text-muted-foreground group-hover:text-foreground'}`}>
                        From {money(priceFor(product, 250))}
                    </p>
                    {product.stock > 0 && product.stock <= 8 && (
                        <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-green-700 dark:text-green-400 animate-pulse">
                            Only {product.stock} packs left
                        </p>
                    )}
                    {oos && <p className="mt-2 text-xs text-muted-foreground uppercase tracking-widest">Out of stock</p>}
                </div>
                <Button
                    size="icon"
                    variant="quiet"
                    aria-label={`Add ${product.name}`}
                    disabled={oos}
                    onClick={() => cart.add(product, 250, 1)}
                    className="group/btn relative overflow-hidden transition-all duration-300 active:scale-90 hover:bg-black hover:text-white"
                >
                    <Plus className="h-5 w-5 transition-transform duration-300 group-hover/btn:rotate-90 group-active/btn:scale-75" />
                </Button>
            </div>
        </article>
    );
}