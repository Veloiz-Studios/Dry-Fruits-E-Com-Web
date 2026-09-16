CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.admin_allowlist (
  email text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_allowlist TO authenticated;
GRANT ALL ON public.admin_allowlist TO service_role;
ALTER TABLE public.admin_allowlist ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_veloiz_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.admin_allowlist a WHERE lower(a.email) = lower(coalesce(auth.jwt()->>'email','')))
$$;
GRANT EXECUTE ON FUNCTION public.is_veloiz_admin() TO authenticated;
CREATE POLICY "Allowed admins can view allowlist" ON public.admin_allowlist FOR SELECT TO authenticated USING (public.is_veloiz_admin());

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL UNIQUE, slug text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '', image_url text NOT NULL DEFAULT '', display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active categories" ON public.categories FOR SELECT TO anon USING (is_active);
CREATE POLICY "Authenticated reads active categories" ON public.categories FOR SELECT TO authenticated USING (is_active OR public.is_veloiz_admin());
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL TO authenticated USING (public.is_veloiz_admin()) WITH CHECK (public.is_veloiz_admin());
CREATE TRIGGER categories_updated BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  name text NOT NULL, slug text NOT NULL UNIQUE, short_description text NOT NULL, long_description text NOT NULL,
  image_urls text[] NOT NULL DEFAULT '{}', is_active boolean NOT NULL DEFAULT true, is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active products" ON public.products FOR SELECT TO anon USING (is_active);
CREATE POLICY "Authenticated reads products" ON public.products FOR SELECT TO authenticated USING (is_active OR public.is_veloiz_admin());
CREATE POLICY "Admins manage products" ON public.products FOR ALL TO authenticated USING (public.is_veloiz_admin()) WITH CHECK (public.is_veloiz_admin());
CREATE TRIGGER products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  weight_grams integer NOT NULL CHECK (weight_grams > 0), price_paise integer NOT NULL CHECK (price_paise >= 0),
  stock_quantity integer NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0), low_stock_threshold integer NOT NULL DEFAULT 8 CHECK (low_stock_threshold >= 0),
  sku text NOT NULL UNIQUE, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(product_id, weight_grams)
);
GRANT SELECT ON public.product_variants TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.product_variants TO authenticated;
GRANT ALL ON public.product_variants TO service_role;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads variants" ON public.product_variants FOR SELECT TO anon USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id=product_id AND p.is_active));
CREATE POLICY "Authenticated reads variants" ON public.product_variants FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id=product_id AND p.is_active) OR public.is_veloiz_admin());
CREATE POLICY "Admins manage variants" ON public.product_variants FOR ALL TO authenticated USING (public.is_veloiz_admin()) WITH CHECK (public.is_veloiz_admin());
CREATE TRIGGER variants_updated BEFORE UPDATE ON public.product_variants FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_number text NOT NULL UNIQUE,
  customer_name text NOT NULL, phone text NOT NULL, email text NOT NULL, address jsonb NOT NULL,
  subtotal_paise integer NOT NULL CHECK (subtotal_paise >= 0), delivery_paise integer NOT NULL CHECK (delivery_paise >= 0), total_paise integer NOT NULL CHECK (total_paise >= 0),
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','failed','refunded')),
  order_status text NOT NULL DEFAULT 'pending' CHECK (order_status IN ('pending','confirmed','processing','shipped','delivered','cancelled')),
  razorpay_order_id text UNIQUE, razorpay_payment_id text, paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage orders" ON public.orders FOR ALL TO authenticated USING (public.is_veloiz_admin()) WITH CHECK (public.is_veloiz_admin());
CREATE TRIGGER orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id), variant_id uuid NOT NULL REFERENCES public.product_variants(id),
  product_name text NOT NULL, weight_grams integer NOT NULL, quantity integer NOT NULL CHECK (quantity > 0), unit_price_paise integer NOT NULL CHECK (unit_price_paise >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage order items" ON public.order_items FOR ALL TO authenticated USING (public.is_veloiz_admin()) WITH CHECK (public.is_veloiz_admin());

CREATE TABLE public.business_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id), business_name text NOT NULL DEFAULT 'Veloiz', owner_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '', email text NOT NULL DEFAULT '', address text NOT NULL DEFAULT '', logo_url text NOT NULL DEFAULT '',
  opening_time time NOT NULL DEFAULT '09:00', closing_time time NOT NULL DEFAULT '19:00', notifications jsonb NOT NULL DEFAULT '{"new_orders":true,"low_stock":true}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_settings TO authenticated;
GRANT ALL ON public.business_settings TO service_role;
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage settings" ON public.business_settings FOR ALL TO authenticated USING (public.is_veloiz_admin()) WITH CHECK (public.is_veloiz_admin());
CREATE TRIGGER settings_updated BEFORE UPDATE ON public.business_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.finalize_paid_order(p_order_id uuid, p_payment_id text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE item record;
BEGIN
  IF EXISTS (SELECT 1 FROM public.orders WHERE id=p_order_id AND payment_status='paid') THEN RETURN; END IF;
  FOR item IN SELECT variant_id, quantity FROM public.order_items WHERE order_id=p_order_id FOR UPDATE LOOP
    UPDATE public.product_variants SET stock_quantity=stock_quantity-item.quantity WHERE id=item.variant_id AND stock_quantity>=item.quantity;
    IF NOT FOUND THEN RAISE EXCEPTION 'Insufficient stock'; END IF;
  END LOOP;
  UPDATE public.orders SET payment_status='paid', order_status='confirmed', razorpay_payment_id=p_payment_id, paid_at=now() WHERE id=p_order_id AND payment_status='pending';
  IF NOT FOUND THEN RAISE EXCEPTION 'Order unavailable'; END IF;
END; $$;
REVOKE ALL ON FUNCTION public.finalize_paid_order(uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_paid_order(uuid,text) TO service_role;

INSERT INTO public.categories (name,slug,description,display_order) VALUES
('Almonds','almonds','Clean sweetness, crisp finish.',1),('Cashews','cashews','Creamy, curved, carefully graded.',2),('Pistachios','pistachios','Roasted gently for a vivid crunch.',3),('Walnuts','walnuts','Buttery halves with a woodland depth.',4),('Raisins','raisins','Sun-dried, jewel-like sweetness.',5),('Dates','dates','Soft, caramel-rich fruit.',6);

INSERT INTO public.products(category_id,name,slug,short_description,long_description,is_featured) SELECT id,'Mamra Almonds','mamra-almonds','Small-batch almonds with a deep, lingering crunch.','Naturally irregular and intensely flavoured, sourced from select mountain orchards and packed in short runs for peak freshness.',true FROM public.categories WHERE slug='almonds';
INSERT INTO public.products(category_id,name,slug,short_description,long_description,is_featured) SELECT id,'Whole W320 Cashews','w320-cashews','Creamy whole cashews, graded for size and snap.','A balanced everyday cashew with a clean ivory colour and naturally buttery finish.',true FROM public.categories WHERE slug='cashews';
INSERT INTO public.products(category_id,name,slug,short_description,long_description,is_featured) SELECT id,'Roasted Pistachios','roasted-pistachios','Open-shell pistachios, roasted low and slow.','A measured roast preserves the nut’s sweetness while bringing out a crisp, savoury finish.',true FROM public.categories WHERE slug='pistachios';
INSERT INTO public.products(category_id,name,slug,short_description,long_description,is_featured) SELECT id,'Kashmiri Walnuts','kashmiri-walnuts','Hand-sorted halves with gentle tannin.','Light, buttery walnut halves chosen for freshness, colour, and a clean finish.',true FROM public.categories WHERE slug='walnuts';
INSERT INTO public.products(category_id,name,slug,short_description,long_description,is_featured) SELECT id,'Afghan Black Raisins','afghan-black-raisins','Dark, soft raisins with wine-like depth.','Naturally dried for concentrated sweetness and a supple texture.',false FROM public.categories WHERE slug='raisins';
INSERT INTO public.products(category_id,name,slug,short_description,long_description,is_featured) SELECT id,'Medjool Dates','medjool-dates','Plush dates with a caramel centre.','Large, soft dates selected for their moist texture and layered caramel character.',true FROM public.categories WHERE slug='dates';

INSERT INTO public.product_variants(product_id,weight_grams,price_paise,stock_quantity,low_stock_threshold,sku)
SELECT p.id,w.g,CASE p.slug WHEN 'mamra-almonds' THEN CASE w.g WHEN 250 THEN 72500 WHEN 500 THEN 139000 ELSE 269000 END WHEN 'w320-cashews' THEN CASE w.g WHEN 250 THEN 42500 WHEN 500 THEN 81000 ELSE 156000 END WHEN 'roasted-pistachios' THEN CASE w.g WHEN 250 THEN 57500 WHEN 500 THEN 109000 ELSE 210000 END WHEN 'kashmiri-walnuts' THEN CASE w.g WHEN 250 THEN 49500 WHEN 500 THEN 94000 ELSE 181000 END WHEN 'afghan-black-raisins' THEN CASE w.g WHEN 250 THEN 29500 WHEN 500 THEN 56000 ELSE 105000 END ELSE CASE w.g WHEN 250 THEN 45000 WHEN 500 THEN 86000 ELSE 165000 END END,
CASE p.slug WHEN 'mamra-almonds' THEN 7 WHEN 'roasted-pistachios' THEN 5 ELSE 28 END,8,upper(substr(p.slug,1,3))||'-'||w.g
FROM public.products p CROSS JOIN (VALUES(250),(500),(1000)) AS w(g);
INSERT INTO public.business_settings(id) VALUES(true);
