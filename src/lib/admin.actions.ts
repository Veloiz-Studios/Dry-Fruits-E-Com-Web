"use server";

export async function fetchDashboard() {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [products, orders, variants] = await Promise.all([
        supabaseAdmin.from("products").select("id, is_active"),
        supabaseAdmin
            .from("orders")
            .select("id, order_number, customer_name, total_paise, payment_status, order_status, created_at")
            .order("created_at", { ascending: false }),
        supabaseAdmin.from("product_variants").select("id, stock_quantity, low_stock_threshold"),
    ]);
    const orderRows = orders.data ?? [];
    return {
        productCount: (products.data ?? []).length,
        orderCount: orderRows.length,
        pendingCount: orderRows.filter((o) => o.order_status === "pending").length,
        lowStockCount: (variants.data ?? []).filter((v) => v.stock_quantity <= v.low_stock_threshold).length,
        revenuePaise: orderRows.filter((o) => o.payment_status === "paid").reduce((sum, o) => sum + o.total_paise, 0),
        recent: orderRows.slice(0, 8),
    };
}

export async function fetchProducts() {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
        .from("products")
        .select("id, name, slug, is_active, is_featured, image_urls, category_id, categories(name), product_variants(id, weight_grams, price_paise, stock_quantity, low_stock_threshold)")
        .order("name");
    if (error) throw error;
    return data ?? [];
}

export async function fetchCategories() {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
        .from("categories")
        .select("id, name, slug, description, image_url, is_active, display_order, products(id)")
        .order("display_order");
    if (error) throw error;
    return data ?? [];
}

export async function fetchOrders() {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
        .from("orders")
        .select("id, order_number, customer_name, phone, email, total_paise, payment_status, order_status, created_at, order_items(product_name, weight_grams, quantity)")
        .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
}

export async function fetchSettings() {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.from("business_settings").select("*").eq("id", true).single();
    if (error) throw error;
    return data;
}

export async function saveProduct(product: any) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const isNew = !product.id;
    let productId = product.id;

    // 1. Upsert Product
    const pData = {
        name: product.name,
        slug: product.slug,
        category_id: product.category_id || null,
        short_description: product.short_description || "",
        long_description: product.long_description || "",
        is_active: product.is_active,
        image_urls: product.image_urls || [],
    };

    if (isNew) {
        const { data, error } = await supabaseAdmin.from("products").insert(pData).select("id").single();
        if (error) throw new Error(error.message);
        productId = data.id;
    } else {
        const { error } = await supabaseAdmin.from("products").update(pData).eq("id", productId);
        if (error) throw new Error(error.message);
    }

    // 2. Upsert Variants
    if (product.variants && Array.isArray(product.variants)) {
        // Collect existing variants to determine what to delete
        const { data: existing } = await supabaseAdmin.from("product_variants").select("id").eq("product_id", productId);
        const existingIds = (existing || []).map((v: any) => v.id);
        const incomingIds = product.variants.map((v: any) => v.id).filter(Boolean);
        const toDelete = existingIds.filter(id => !incomingIds.includes(id));

        if (toDelete.length > 0) {
            const { error: delErr } = await supabaseAdmin.from("product_variants").delete().in("id", toDelete);
            if (delErr) {
                if (delErr.code === '23503') throw new Error("Cannot remove variant: A customer has already ordered this weight size. Please set the stock to 0 instead.");
                throw new Error(delErr.message);
            }
        }

        for (const variant of product.variants) {
            const vData = {
                product_id: productId,
                weight_grams: variant.weight_grams,
                price_paise: variant.price_paise,
                stock_quantity: variant.stock_quantity,
                low_stock_threshold: variant.low_stock_threshold ?? 5,
                sku: variant.sku || `${product.slug}-${variant.weight_grams}`,
            };

            if (variant.id) {
                await supabaseAdmin.from("product_variants").update(vData).eq("id", variant.id);
            } else {
                await supabaseAdmin.from("product_variants").insert(vData);
            }
        }
    }
}

export async function deleteProduct(productId: string) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("products").delete().eq("id", productId);
    if (error) {
        if (error.code === '23503') throw new Error("Cannot delete product: Customers have already placed orders containing this product. Please toggle 'Published' off instead.");
        throw new Error(error.message);
    }
}

export async function saveCategory(category: any) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const isNew = !category.id;

    const cData = {
        name: category.name,
        slug: category.slug,
        description: category.description || "",
        image_url: category.image_url || null,
        is_active: category.is_active,
        display_order: category.display_order ?? 0,
    };

    if (isNew) {
        const { error } = await supabaseAdmin.from("categories").insert(cData);
        if (error) throw new Error(error.message);
    } else {
        const { error } = await supabaseAdmin.from("categories").update(cData).eq("id", category.id);
        if (error) throw new Error(error.message);
    }
}

export async function deleteCategory(categoryId: string) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("categories").delete().eq("id", categoryId);
    if (error) {
        if (error.code === '23503') throw new Error("Cannot delete category: It currently has products assigned to it. Please reassign or delete its products first.");
        throw new Error(error.message);
    }
}

export async function updateOrderStatus(orderId: string, newStatus: string) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("orders").update({ order_status: newStatus }).eq("id", orderId);
    if (error) throw new Error(error.message);
}
