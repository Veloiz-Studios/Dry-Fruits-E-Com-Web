-- Rename Razorpay columns to Cashfree columns in orders table
ALTER TABLE orders 
RENAME COLUMN razorpay_order_id TO cashfree_order_id;

-- Add cashfree payment session id just in case we need it
ALTER TABLE orders 
ADD COLUMN cashfree_session_id text;

-- Update the finalize_paid_order function to reflect the new structure
CREATE OR REPLACE FUNCTION finalize_paid_order(
  p_order_id uuid,
  p_payment_id text
) RETURNS void AS $$
BEGIN
  -- Mark the order as paid, and store the actual payment confirmation ID from Cashfree's verification
  UPDATE orders
  SET 
    payment_status = 'paid',
    order_status = 'confirmed',
    paid_at = now()
  WHERE id = p_order_id AND payment_status = 'pending';

  -- Deduct inventory based on order items
  UPDATE product_variants pv
  SET stock_quantity = pv.stock_quantity - oi.quantity
  FROM order_items oi
  WHERE oi.order_id = p_order_id AND oi.variant_id = pv.id;
END;
$$ LANGUAGE plpgsql;
