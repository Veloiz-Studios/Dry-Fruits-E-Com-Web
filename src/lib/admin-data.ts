import { supabase } from "@/integrations/supabase/client";

export const ORDER_PIPELINE = ["pending", "confirmed", "processing", "shipped", "delivered"] as const;
export type OrderStage = (typeof ORDER_PIPELINE)[number];

export const paise = (value: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value / 100);

export const weightLabel = (grams: number) => (grams === 1000 ? "1kg" : `${grams}g`);

export async function fetchDashboard() {
  const [products, orders, variants] = await Promise.all([
    supabase.from("products").select("id, is_active"),
    supabase
      .from("orders")
      .select("id, order_number, customer_name, total_paise, payment_status, order_status, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("product_variants").select("id, stock_quantity, low_stock_threshold"),
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
  const { data, error } = await supabase
    .from("products")
    .select("id, name, slug, is_active, is_featured, image_urls, category_id, categories(name), product_variants(id, weight_grams, price_paise, stock_quantity, low_stock_threshold)")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function fetchCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, description, image_url, is_active, display_order, products(id)")
    .order("display_order");
  if (error) throw error;
  return data ?? [];
}

export async function fetchOrders() {
  const { data, error } = await supabase
    .from("orders")
    .select("id, order_number, customer_name, phone, email, total_paise, payment_status, order_status, created_at, order_items(product_name, weight_grams, quantity)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchSettings() {
  const { data, error } = await supabase.from("business_settings").select("*").eq("id", true).single();
  if (error) throw error;
  return data;
}

export function toCsv(rows: Record<string, string | number>[]) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]!);
  const escape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
  return [headers.join(","), ...rows.map((row) => headers.map((h) => escape(row[h] ?? "")).join(","))].join("\n");
}

export function downloadCsv(filename: string, csv: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
