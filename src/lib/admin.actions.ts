"use server";

import { cookies } from "next/headers";
import { checkAdminPhone } from "./orders.functions";

export async function setAdminAuthCookie(token: string) {
    (await cookies()).set("veloiz_admin_token", token, { httpOnly: true, secure: true, maxAge: 60 * 60 * 24 * 7 });
}

export async function clearAdminAuthCookie() {
    (await cookies()).delete("veloiz_admin_token");
}

async function requireAdmin() {
    const token = (await cookies()).get("veloiz_admin_token")?.value;
    if (!token) throw new Error("Unauthorized: Missing Admin Token");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user || !data.user.phone) throw new Error("Unauthorized: Invalid Token");

    // Strict DB security context double-verification
    const isAllowed = await checkAdminPhone(data.user.phone);
    if (!isAllowed) throw new Error("Unauthorized: Phone number not on Veloiz Admin Allowlist");
}



export async function fetchDashboard() {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [ordersRes, variantsRes, productsRes] = await Promise.all([
        supabaseAdmin.from("orders").select("id, total_paise, payment_status, order_status, order_number, customer_name, created_at").order("created_at", { ascending: false }),
        supabaseAdmin.from("product_variants").select("id").lte("stock_quantity", 8), // Assuming 8 is generic low threshold
        supabaseAdmin.from("products").select("id", { count: "exact", head: true }),
    ]);

    const orders = ordersRes.data || [];
    const revenuePaise = orders.filter(o => o.payment_status === "paid").reduce((sum, o) => sum + (o.total_paise || 0), 0);
    const pendingCount = orders.filter(o => ["pending", "confirmed", "processing"].includes(o.order_status)).length;

    return {
        revenuePaise,
        orderCount: orders.length,
        pendingCount,
        lowStockCount: variantsRes.data?.length || 0,
        productCount: productsRes.count || 0,
        recent: orders.slice(0, 8),
    };
}

export async function fetchAnalytics() {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Fetch all orders with deep joins, plus aggregate metadata queries
    const [ordersRes, pendingRes, productsRes] = await Promise.all([
        supabaseAdmin
            .from("orders")
            .select(`
            created_at, total_paise, payment_status, order_number, customer_name, order_status,
            phone, email, address,
            order_items(product_name, quantity, weight_grams, products(categories(name)))
        `)
            .order("created_at", { ascending: true }),
        supabaseAdmin.from("orders").select("id", { count: "exact" }).in("order_status", ["pending", "processing"]),
        supabaseAdmin.from("products").select("id", { count: "exact" }).eq("is_active", true)
    ]);

    if (ordersRes.error) throw ordersRes.error;

    const allOrders = ordersRes.data || [];
    const paid = allOrders.filter(o => o.payment_status === "paid" || o.payment_status === "pending");

    const dailyMap: Record<string, { date: string, revenue: number, orders: number }> = {};
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        dailyMap[dateStr] = { date: dateStr, revenue: 0, orders: 0 };
    }

    const productFrequency: Record<string, number> = {};
    const categoryFrequency: Record<string, number> = {};
    let totalItemsSold = 0;

    for (const o of paid) {
        const dateStr = o.created_at.split("T")[0];
        if (dailyMap[dateStr]) {
            dailyMap[dateStr].revenue += (o.total_paise / 100);
            dailyMap[dateStr].orders += 1;
        }

        for (const item of (o.order_items || [])) {
            productFrequency[item.product_name] = (productFrequency[item.product_name] || 0) + item.quantity;
            totalItemsSold += item.quantity;
            // Aggregate Category Data
            const catName = (item.products as any)?.categories?.name || "Unknown";
            categoryFrequency[catName] = (categoryFrequency[catName] || 0) + item.quantity;
        }
    }

    const growth = Object.values(dailyMap);
    const topProducts = Object.entries(productFrequency).map(([name, sales]) => ({ name, sales })).sort((a, b) => b.sales - a.sales).slice(0, 5);
    const salesByCategory = Object.entries(categoryFrequency).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    const totalRevenue = paid.reduce((s, o) => s + (o.total_paise / 100), 0);
    const averageOrderValue = paid.length > 0 ? (totalRevenue / paid.length) : 0;
    const avgItemsPerOrder = paid.length > 0 ? (totalItemsSold / paid.length) : 0;

    // Format raw dumps for CSV export
    const rawOrdersExport = allOrders.map(o => ({
        OrderNumber: o.order_number,
        Date: o.created_at,
        Customer: o.customer_name,
        Phone: o.phone || '',
        Email: o.email || '',
        Address: o.address ? `${(o.address as any).line1}, ${(o.address as any).city}, ${(o.address as any).state} - ${(o.address as any).pincode}` : '',
        Items: o.order_items ? o.order_items.map((i: any) => `${i.product_name} (${i.weight_grams}g x ${i.quantity})`).join(" | ") : '',
        Payment: o.payment_status,
        Status: o.order_status,
        Total: `Rs. ${o.total_paise / 100}`
    }));

    return {
        totalRevenue,
        totalOrders: paid.length,
        averageOrderValue,
        pendingOrders: pendingRes.count || 0,
        activeProducts: productsRes.count || 0,
        growth,
        topProducts,
        salesByCategory,
        rawOrdersExport
    };
}

export async function fetchProducts() {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
        .from("products")
        .select("id, name, slug, is_active, is_featured, image_urls, category_id, categories(name), product_variants(id, weight_grams, price_paise, stock_quantity, low_stock_threshold)")
        .order("name");
    if (error) throw error;
    return data ?? [];
}

export async function fetchCategories() {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
        .from("categories")
        .select("id, name, slug, description, image_url, is_active, display_order, products(id)")
        .order("display_order");
    if (error) throw error;
    return data ?? [];
}

export async function fetchOrders() {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
        .from("orders")
        .select("id, order_number, customer_name, phone, email, address, total_paise, payment_status, order_status, created_at, order_items(product_name, weight_grams, quantity)")
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
    await requireAdmin();
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
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("products").delete().eq("id", productId);
    if (error) {
        if (error.code === '23503') throw new Error("Cannot delete product: Customers have already placed orders containing this product. Please toggle 'Published' off instead.");
        throw new Error(error.message);
    }
}

export async function saveCategory(category: any) {
    await requireAdmin();
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
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("categories").delete().eq("id", categoryId);
    if (error) {
        if (error.code === '23503') throw new Error("Cannot delete category: It currently has products assigned to it. Please reassign or delete its products first.");
        throw new Error(error.message);
    }
}

export async function updateOrderStatus(orderId: string, newStatus: string) {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.from("orders").update({ order_status: newStatus }).eq("id", orderId).select("order_number").single();
    if (error) throw new Error(error.message);

    if (data?.order_number) {
        const channel = supabaseAdmin.channel(`order-tracker-${data.order_number}`);
        await channel.send({
            type: 'broadcast',
            event: 'status_update',
            payload: { order_status: newStatus }
        });
        await supabaseAdmin.removeChannel(channel);
    }
}

export async function updateVariantStock(variantId: string, diff: number) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: v } = await supabaseAdmin.from("product_variants").select("stock_quantity").eq("id", variantId).single();
    if (!v) throw new Error("Variant not found");
    const newStock = Math.max(0, v.stock_quantity + diff);
    const { error } = await supabaseAdmin.from("product_variants").update({ stock_quantity: newStock }).eq("id", variantId);
    if (error) throw new Error(error.message);
    return newStock;
}

export async function updateSettings(settings: any) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
        business_name: settings.business_name,
        owner_name: settings.owner_name,
        phone: settings.phone,
        email: settings.email,
        address: settings.address,
        opening_time: settings.opening_time,
        closing_time: settings.closing_time,
        logo_url: settings.logo_url,
        notifications: settings.notifications
    };
    const { error } = await supabaseAdmin.from("business_settings").update(payload).eq("id", true);
    if (error) throw new Error(error.message);
}

export async function uploadAdminImage(formData: FormData) {
    const file = formData.get("file") as File;
    if (!file) throw new Error("No file uploaded");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Autoprovision Bucket Safely
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    if (!buckets?.find(b => b.name === 'veloiz_media')) {
        await supabaseAdmin.storage.createBucket('veloiz_media', { public: true, fileSizeLimit: 5242880, allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'] });
    }

    const ext = file.name.split('.').pop();
    const filePath = `${crypto.randomUUID()}.${ext}`;

    const { error } = await supabaseAdmin.storage.from('veloiz_media').upload(filePath, file, { cacheControl: '3600', upsert: false });
    if (error) throw new Error(error.message);

    const { data: { publicUrl } } = supabaseAdmin.storage.from('veloiz_media').getPublicUrl(filePath);
    return publicUrl;
}
