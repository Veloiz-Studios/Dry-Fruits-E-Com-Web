"use client";

import { useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ProductCard } from "@/components/product-card";
import { StoreShell } from "@/components/store-shell";
import { products } from "@/lib/catalog";

function ShopContent() {
    const searchParams = useSearchParams();
    const initial = searchParams.get("category") ?? "All";
    const [category, setCategory] = useState(initial);
    const [query, setQuery] = useState("");
    const [stock, setStock] = useState(false);

    const shown = useMemo(
        () =>
            products.filter(
                (p) =>
                    (category === "All" || p.category === category) &&
                    p.name.toLowerCase().includes(query.toLowerCase()) &&
                    (!stock || p.stock > 0)
            ),
        [category, query, stock]
    );

    return (
        <StoreShell>
            <section className="mx-auto max-w-[1440px] px-5 py-14 md:px-10 md:py-20">
                <p className="text-xs uppercase tracking-[.2em]">The complete pantry</p>
                <h1 className="mt-4 max-w-4xl text-6xl leading-[.88] md:text-8xl">
                    Everyday provisions,<br />
                    <em>properly selected.</em>
                </h1>
                <div className="mt-14 grid gap-8 border-y editorial-rule py-6 lg:grid-cols-[1fr_auto]">
                    <label className="relative max-w-xl">
                        <Search className="absolute left-0 top-3 h-4 w-4" />
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search the pantry"
                            className="border-0 border-b bg-transparent pl-7 shadow-none"
                        />
                    </label>
                    <div className="flex flex-wrap items-center gap-5">
                        <div className="flex flex-wrap gap-2">
                            {["All", ...new Set(products.map((p) => p.category))].map((c) => (
                                <button
                                    key={c}
                                    onClick={() => setCategory(c)}
                                    className={`border-b pb-1 text-sm ${category === c ? "border-primary text-primary" : "border-transparent"
                                        }`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                        <label className="flex items-center gap-2 text-sm">
                            <Switch checked={stock} onCheckedChange={setStock} />
                            In stock only
                        </label>
                    </div>
                </div>
                {shown.length ? (
                    <div className="mt-12 grid gap-x-7 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
                        {shown.map((p) => (
                            <ProductCard key={p.id} product={p} />
                        ))}
                    </div>
                ) : (
                    <div className="py-28 text-center">
                        <p className="font-display text-5xl">Nothing in this handful.</p>
                        <p className="mt-3 text-muted-foreground">Try another category or a broader search.</p>
                    </div>
                )}
            </section>
        </StoreShell>
    );
}

export default function ShopPage() {
    return (
        <Suspense>
            <ShopContent />
        </Suspense>
    );
}
