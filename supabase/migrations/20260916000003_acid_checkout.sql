CREATE OR REPLACE FUNCTION public.create_order_atomic(
  p_order_number text,
  p_customer_name text,
  p_phone text,
  p_email text,
  p_address jsonb,
  p_subtotal int,
  p_delivery int,
  p_total int,
  p_cashfree_order_id text,
  p_cashfree_session_id text,
  p_items jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id uuid;
  v_item jsonb;
BEGIN
  -- Insert into orders table atomically
  INSERT INTO public.orders (
    order_number, customer_name, phone, email, address,
    subtotal_paise, delivery_paise, total_paise,
    cashfree_order_id, cashfree_session_id
  ) VALUES (
    p_order_number, p_customer_name, p_phone, p_email, p_address,
    p_subtotal, p_delivery, p_total,
    p_cashfree_order_id, p_cashfree_session_id
  ) RETURNING id INTO v_order_id;

  -- Iterate through items and insert them ensuring Atomicity
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.order_items (
      order_id, product_id, variant_id, product_name, 
      weight_grams, quantity, unit_price_paise
    ) VALUES (
      v_order_id, 
      (v_item->>'product_id')::uuid,
      (v_item->>'variant_id')::uuid,
      v_item->>'product_name',
      (v_item->>'weight_grams')::int,
      (v_item->>'quantity')::int,
      (v_item->>'unit_price_paise')::int
    );
  END LOOP;

  RETURN v_order_id;
END;
$$;
