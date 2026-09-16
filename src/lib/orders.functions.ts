import { createServerFn } from "@tanstack/react-start";
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

/** Creates a pending order priced from the database, plus a Razorpay attempt when keys are configured. */
export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => createSchema.parse(input))
  .handler(async ({ data }) => {
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

    const keyId = process.env["RAZORPAY_KEY_ID"];
    const keySecret = process.env["RAZORPAY_KEY_SECRET"];
    let razorpayOrderId: string | null = null;

    if (keyId && keySecret) {
      const response = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}`,
        },
        body: JSON.stringify({ amount: total, currency: "INR", receipt: number }),
      });
      if (!response.ok) {
        console.error("Razorpay order failed", await response.text());
        throw new Error("Payment provider unavailable. Please try again.");
      }
      razorpayOrderId = ((await response.json()) as { id: string }).id;
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        order_number: number,
        customer_name: data.customer_name,
        phone: data.phone,
        email: data.email,
        address: data.address,
        subtotal_paise: subtotal,
        delivery_paise: delivery,
        total_paise: total,
        razorpay_order_id: razorpayOrderId,
      })
      .select("id, order_number")
      .single();
    if (orderError || !order) throw new Error(orderError?.message ?? "Could not place order");

    const { error: itemsError } = await supabaseAdmin
      .from("order_items")
      .insert(lines.map((l) => ({ ...l, order_id: order.id })));
    if (itemsError) throw new Error(itemsError.message);

    return {
      orderId: order.id,
      orderNumber: order.order_number,
      totalPaise: total,
      subtotalPaise: subtotal,
      deliveryPaise: delivery,
      razorpayOrderId,
      razorpayKeyId: keyId ?? null,
      paymentConfigured: Boolean(keyId && keySecret),
    };
  });

const verifySchema = z.object({
  orderId: z.string().uuid(),
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

/** Verifies the Razorpay signature server-side, then marks paid and decrements stock atomically. */
export const verifyPayment = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => verifySchema.parse(input))
  .handler(async ({ data }) => {
    const keySecret = process.env["RAZORPAY_KEY_SECRET"];
    if (!keySecret) throw new Error("Payments are not configured");

    const { createHmac, timingSafeEqual } = await import("crypto");
    const expected = createHmac("sha256", keySecret)
      .update(`${data.razorpay_order_id}|${data.razorpay_payment_id}`)
      .digest("hex");
    const given = Buffer.from(data.razorpay_signature);
    const want = Buffer.from(expected);
    if (given.length !== want.length || !timingSafeEqual(given, want)) {
      throw new Error("Payment verification failed");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order, error: lookupError } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, razorpay_order_id")
      .eq("id", data.orderId)
      .single();
    if (lookupError || !order) throw new Error("Order not found");
    if (order.razorpay_order_id !== data.razorpay_order_id) throw new Error("Payment verification failed");

    const { error } = await supabaseAdmin.rpc("finalize_paid_order", {
      p_order_id: data.orderId,
      p_payment_id: data.razorpay_payment_id,
    });
    if (error) throw new Error(error.message);

    return { orderNumber: order.order_number };
  });

/** Public read of a single order by its order number, for the confirmation screen. */
export const getOrderByNumber = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ orderNumber: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select(
        "order_number, customer_name, email, phone, address, subtotal_paise, delivery_paise, total_paise, payment_status, order_status, created_at, order_items(product_name, weight_grams, quantity, unit_price_paise)",
      )
      .eq("order_number", data.orderNumber)
      .maybeSingle();
    return order ?? null;
  });
