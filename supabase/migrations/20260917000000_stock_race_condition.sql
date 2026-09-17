CREATE OR REPLACE FUNCTION finalize_paid_order(
  p_order_id uuid,
  p_payment_id text
) RETURNS void AS $$
DECLARE
  v_updated_id uuid;
  v_insufficient_stock boolean;
BEGIN
  -- Race Condition Shield: Exclusively lock the variant rows related to this order 
  -- so no other simultaneous network request can modify their stock at this microsecond
  PERFORM pv.id 
  FROM order_items oi
  JOIN product_variants pv ON pv.id = oi.variant_id
  WHERE oi.order_id = p_order_id
  FOR UPDATE;

  -- Phase 2: Now that rows are locked, evaluate if stock has been depleted by someone else
  SELECT true INTO v_insufficient_stock
  FROM order_items oi
  JOIN product_variants pv ON pv.id = oi.variant_id
  WHERE oi.order_id = p_order_id AND pv.stock_quantity < oi.quantity
  LIMIT 1;

  IF v_insufficient_stock THEN
    -- If a transaction race occurred and stock ran out before payment successfully cleared
    RAISE EXCEPTION 'Transaction Race Condition Averted: Insufficient stock remained after payment attempt. Manual refund workflow triggered.';
  END IF;

  -- Phase 3: Safe Execution Boundary.
  -- Mark the order as paid only if it is actually still pending
  UPDATE orders
  SET 
    payment_status = 'paid',
    order_status = 'confirmed',
    paid_at = now()
  WHERE id = p_order_id AND payment_status = 'pending'
  RETURNING id INTO v_updated_id;

  -- Only deduct inventory if we just transitioned the state in this exact execution
  IF v_updated_id IS NOT NULL THEN
    UPDATE product_variants pv
    SET stock_quantity = pv.stock_quantity - oi.quantity
    FROM order_items oi
    WHERE oi.order_id = p_order_id AND oi.variant_id = pv.id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Apply an absolute safety constraint at the database schema level
ALTER TABLE product_variants DROP CONSTRAINT IF EXISTS prevent_negative_stock;
ALTER TABLE product_variants ADD CONSTRAINT prevent_negative_stock CHECK (stock_quantity >= 0);
