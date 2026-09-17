CREATE OR REPLACE FUNCTION finalize_paid_order(
  p_order_id uuid,
  p_payment_id text
) RETURNS void AS $$
DECLARE
  v_updated_id uuid;
BEGIN
  -- Mark the order as paid only if it is actually still pending
  UPDATE orders
  SET 
    payment_status = 'paid',
    order_status = 'confirmed',
    paid_at = now()
  WHERE id = p_order_id AND payment_status = 'pending'
  RETURNING id INTO v_updated_id;

  -- Only deduct inventory if we just transitioned the state in this exact exact execution
  IF v_updated_id IS NOT NULL THEN
    UPDATE product_variants pv
    SET stock_quantity = pv.stock_quantity - oi.quantity
    FROM order_items oi
    WHERE oi.order_id = p_order_id AND oi.variant_id = pv.id;
  END IF;
END;
$$ LANGUAGE plpgsql;
