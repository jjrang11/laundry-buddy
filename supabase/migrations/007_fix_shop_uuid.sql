-- ============================================================
-- Laundry Buddy – Fix Default Shop UUID
-- Replaces the hardcoded '00000000-0000-0000-0000-000000000001'
-- shop_id with a proper gen_random_uuid() value.
-- ============================================================

do $$
declare
  new_shop_id uuid := gen_random_uuid();
  old_shop_id uuid := '00000000-0000-0000-0000-000000000001';
begin
  -- 1. Insert replacement shop with a real UUID
  insert into public.shops (id, name)
  values (new_shop_id, 'Default Shop');

  -- 2. Repoint all tenant data to the new UUID
  update public.settings           set shop_id = new_shop_id where shop_id = old_shop_id;
  update public.orders             set shop_id = new_shop_id where shop_id = old_shop_id;
  update public.additional_charges set shop_id = new_shop_id where shop_id = old_shop_id;

  -- 3. Remove the placeholder shop row
  delete from public.shops where id = old_shop_id;
end;
$$;
