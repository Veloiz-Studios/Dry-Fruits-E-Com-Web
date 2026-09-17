"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "./catalog";

// Fallback images since the DB initially has empty image_urls
import almonds from "@/assets/veloiz-almonds.jpg";
import cashews from "@/assets/veloiz-cashews.jpg";
import pistachios from "@/assets/veloiz-pistachios.jpg";

export function useLiveCatalog() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCatalog();

        const channel = supabase
            .channel('public:product_variants')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'product_variants' }, () => fetchCatalog())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => fetchCatalog())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    async function fetchCatalog() {
        const { data, error } = await supabase
            .from("products")
            .select(`
                id, slug, name, short_description, long_description,
                categories(name),
                product_variants(weight_grams, price_paise, stock_quantity)
            `)
            .eq('is_active', true);

        if (error) {
            console.error("Failed to fetch live catalog:", error);
            setLoading(false);
            return;
        }

        const liveProducts: Product[] = (data || []).map((p: any) => {
            const prices: Record<number, number> = {};
            const stocks: Record<number, number> = {};
            let totalStock = 0;

            if (p.product_variants) {
                p.product_variants.forEach((v: any) => {
                    prices[v.weight_grams] = v.price_paise / 100; // Store as rupees in Product interface
                    stocks[v.weight_grams] = v.stock_quantity;
                    totalStock += v.stock_quantity;
                });
            }

            // Assign static image based on name for now until user uploads actual photos to Supabase Storage
            let imageFallback = almonds;
            if (p.name.toLowerCase().includes("cashew")) imageFallback = cashews;
            if (p.name.toLowerCase().includes("pistachio") || p.name.toLowerCase().includes("raisin")) imageFallback = pistachios;

            return {
                id: p.id,
                slug: p.slug,
                name: p.name,
                category: p.categories?.name ?? "General",
                image: imageFallback.src,
                short: p.short_description,
                long: p.long_description,
                stock: totalStock, // Cumulative availability
                prices: prices,
                stocks: stocks
            } as Product;
        });

        setProducts(liveProducts);
        setLoading(false);
    }

    return { products, loading };
}
