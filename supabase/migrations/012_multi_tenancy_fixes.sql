-- Fix 1: Enforce one settings row per shop
-- Prevents duplicate settings rows which could cause silent bugs
-- when reading/updating price_per_kg.
ALTER TABLE public.settings
  ADD CONSTRAINT settings_shop_id_unique UNIQUE (shop_id);

-- Fix 2: Prevent hard deletes on orders (enforce soft-delete pattern)
-- Orders should only be removed by setting deleted_at = now().
-- A hard DELETE bypasses audit trails and the soft-delete filter.
CREATE OR REPLACE FUNCTION public.prevent_order_hard_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Hard deletes on orders are not allowed. Set deleted_at instead.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_no_hard_delete
  BEFORE DELETE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_order_hard_delete();
