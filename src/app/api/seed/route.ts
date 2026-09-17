import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { products } from "@/lib/catalog";

export async function POST() {
    try {
        const catsAndProducts = products.reduce((acc, p) => {
            if (!acc.categories.includes(p.category)) acc.categories.push(p.category);
            return acc;
        }, { categories: [] as string[] });

        // Insert categories
        const categoryMap: Record<string, string> = {};
        for (const c of catsAndProducts.categories) {
            const { data } = await supabaseAdmin.from("categories")
                .upsert({ name: c, slug: c.toLowerCase(), description: `${c} dry fruits`, image_url: "", is_active: true, display_order: 1 })
                .select("id").single();
            if (data) categoryMap[c] = data.id;
        }

        // Insert Products & Variants
        for (const p of products) {
            const { data: prod } = await supabaseAdmin.from("products")
                .upsert({
                    name: p.name,
                    slug: p.slug,
                    short_description: p.short,
                    long_description: p.long,
                    category_id: categoryMap[p.category],
                    is_active: true,
                    is_featured: true,
                    image_urls: []
                }, { onConflict: "slug" })
                .select("id").single();

            if (prod) {
                // Insert variants based on prices object `{ 250: 725, 500: 1390 }`
                const variants = [];
                for (const [weightStr, price] of Object.entries(p.prices)) {
                    variants.push({
                        product_id: prod.id,
                        sku: `${p.slug}-${weightStr}`,
                        weight_grams: parseInt(weightStr),
                        price_paise: price * 100, // DB stores in paise
                        stock_quantity: p.stock,
                        low_stock_threshold: 8
                    });
                }

                await supabaseAdmin.from("product_variants").upsert(variants, { onConflict: 'sku' });
            }
        }

        return NextResponse.json({ success: true, count: products.length });
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
