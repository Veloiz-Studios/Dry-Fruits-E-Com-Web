"use server";

import { z } from "zod";

const lineSchema = z.object({ slug: z.string(), weight: z.number(), quantity: z.number().int().min(1).max(50) });

const createSchema = z.object({
  customer_name: z.string().min(2),
  phone: z.string().min(6),
  email: z.string().email(),
  address: z.object({ line1: z.string().min(3), city: z.string().min(2), state: z.string().min(2), pincode: z.string().min(4) }),
  items: z.array(lineSchema).min(1),
});

const DELIVERY_PAISE = 9900;
const FREE_DELIVERY_ABOVE = 150000;

function orderNumber() {
  return `VLZ-${Date.now().toString(36).toUpperCase()}`;
}

export async function createOrder({ data: input }: { data: unknown }) {
  const data = createSchema.parse(input);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: rows, error } = await supabaseAdmin
    .from("product_variants")
    .select("id, weight_grams, price_paise, stock_quantity, products!inner(id, name, slug, is_active)");
  if (error) throw new Error(error.message);

  const lines = data.items.map((item) => {
    const variant = (rows ?? []).find(
      (r) => r.weight_grams === item.weight && (r.products as { slug: string }).slug === item.slug,
    );
    if (!variant) throw new Error(`Unavailable item: ${item.slug}`);
    const product = variant.products as unknown as { id: string; name: string; is_active: boolean };
    if (!product.is_active) throw new Error(`Unavailable item: ${item.slug}`);
    if (variant.stock_quantity < item.quantity) throw new Error(`Only ${variant.stock_quantity} left of ${product.name}`);
    return {
      product_id: product.id,
      variant_id: variant.id,
      product_name: product.name,
      weight_grams: variant.weight_grams,
      quantity: item.quantity,
      unit_price_paise: variant.price_paise,
    };
  });

  const subtotal = lines.reduce((sum, l) => sum + l.unit_price_paise * l.quantity, 0);
  const delivery = subtotal >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_PAISE;
  const total = subtotal + delivery;
  const number = orderNumber();

  const appId = process.env["CASHFREE_APP_ID"] || process.env["NEXT_PUBLIC_CASHFREE_APP_ID"];
  const secretKey = process.env["CASHFREE_SECRET_KEY"];
  const env = process.env["CASHFREE_ENVIRONMENT"] || "SANDBOX";
  const baseUrl = env === "PRODUCTION" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg";

  let paymentSessionId: string | null = null;
  let cashfreeOrderId = number;

  if (appId && secretKey) {
    const origin = process.env.NEXT_PUBLIC_BASE_URL
      || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null)
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    const response = await fetch(`${baseUrl}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": appId,
        "x-client-secret": secretKey,
        "x-api-version": "2023-08-01",
      },
      body: JSON.stringify({
        order_amount: total / 100, // Cashfree requires decimal layout for INR (Rupees)
        order_currency: "INR",
        order_id: cashfreeOrderId,
        customer_details: {
          customer_id: data.email.replace(/[^a-zA-Z0-9]/g, '').substring(0, 50),
          customer_name: data.customer_name,
          customer_email: data.email,
          customer_phone: data.phone,
        },
        order_meta: {
          return_url: `${origin}/order/${cashfreeOrderId}?verify=true`
        }
      }),
    });

    if (!response.ok) {
      console.error("Cashfree order failed", await response.text());
      throw new Error("Payment provider unavailable. Please try again.");
    }

    const gatewayData = await response.json();
    paymentSessionId = gatewayData.payment_session_id;
  }

  const { data: orderId, error: rpcError } = await supabaseAdmin.rpc("create_order_atomic", {
    p_order_number: number,
    p_customer_name: data.customer_name,
    p_phone: data.phone,
    p_email: data.email,
    p_address: data.address,
    p_subtotal: subtotal,
    p_delivery: delivery,
    p_total: total,
    p_cashfree_order_id: cashfreeOrderId,
    p_cashfree_session_id: paymentSessionId ?? "",
    p_items: lines
  });

  if (rpcError || !orderId) throw new Error(rpcError?.message ?? "Could not place order atomically");

  return {
    orderId: String(orderId),
    orderNumber: number,
    totalPaise: total,
    subtotalPaise: subtotal,
    deliveryPaise: delivery,
    paymentSessionId,
    paymentConfigured: Boolean(appId && secretKey),
    cashfreeEnvironment: env, // Expose explicitly for the JS SDK configuration
  };
}

export async function verifyPayment({ orderNumber }: { orderNumber: string }) {
  const appId = process.env["CASHFREE_APP_ID"] || process.env["NEXT_PUBLIC_CASHFREE_APP_ID"];
  const secretKey = process.env["CASHFREE_SECRET_KEY"];
  const env = process.env["CASHFREE_ENVIRONMENT"] || "SANDBOX";
  const baseUrl = env === "PRODUCTION" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg";

  if (!appId || !secretKey) throw new Error("Payments are not configured");

  // Fetch the order from Cashfree to verify payment status securely over server-to-server
  const response = await fetch(`${baseUrl}/orders/${orderNumber}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-client-id": appId,
      "x-client-secret": secretKey,
      "x-api-version": "2023-08-01",
    },
  });

  if (!response.ok) {
    throw new Error("Payment provider returned an error.");
  }

  const gatewayData = await response.json();

  if (gatewayData.order_status !== "PAID") {
    throw new Error("Payment is not PAID yet.");
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: order, error: lookupError } = await supabaseAdmin
    .from("orders")
    .select("id, order_number")
    .eq("order_number", orderNumber)
    .single();

  if (lookupError || !order) throw new Error("Order not found");

  const { error } = await supabaseAdmin.rpc("finalize_paid_order", {
    p_order_id: order.id,
    p_payment_id: String(gatewayData.cf_order_id),
  });

  if (error) throw new Error(error.message);

  return { orderNumber: order.order_number };
}

export async function getOrderByNumber({ data: input }: { data: unknown }) {
  const data = z.object({ orderNumber: z.string() }).parse(input);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: order } = await supabaseAdmin
    .from("orders")
    .select(
      "order_number, customer_name, email, phone, address, subtotal_paise, delivery_paise, total_paise, payment_status, order_status, created_at, order_items(product_name, weight_grams, quantity, unit_price_paise)",
    )
    .eq("order_number", data.orderNumber)
    .maybeSingle();
  return order ?? null;
}

export async function checkAdminPhone(phone: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("admin_allowlist")
    .select("phone")
    .eq("phone", phone)
    .maybeSingle();

  if (error) console.error("Admin check error:", error);
  return Boolean(data);
}

export async function getTrackedOrders(orderNumbers: string[]) {
  if (!orderNumbers || orderNumbers.length === 0) return [];
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("orders")
    .select("order_number, created_at, order_status, total_paise, order_items(product_name, quantity)")
    .in("order_number", orderNumbers)
    .order("created_at", { ascending: false });
  return data ?? [];
}
