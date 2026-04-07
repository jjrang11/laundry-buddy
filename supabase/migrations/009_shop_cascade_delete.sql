-- ============================================================
-- Laundry Buddy – Shop Cascade Delete
-- Re-adds FK constraints on orders, additional_charges, and
-- settings with ON DELETE CASCADE so that deleting a shop row
-- automatically removes all its dependent data.
--
-- order_charges already has ON DELETE CASCADE via orders.id,
-- so it is handled transitively.
-- ============================================================

-- ── orders ────────────────────────────────────────────────────────────────────

alter table public.orders
  drop constraint if exists orders_shop_id_fkey;

alter table public.orders
  add constraint orders_shop_id_fkey
  foreign key (shop_id) references public.shops(id) on delete cascade;

-- ── additional_charges ────────────────────────────────────────────────────────

alter table public.additional_charges
  drop constraint if exists additional_charges_shop_id_fkey;

alter table public.additional_charges
  add constraint additional_charges_shop_id_fkey
  foreign key (shop_id) references public.shops(id) on delete cascade;

-- ── settings ──────────────────────────────────────────────────────────────────

alter table public.settings
  drop constraint if exists fk_settings_shop;

alter table public.settings
  add constraint fk_settings_shop
  foreign key (shop_id) references public.shops(id) on delete cascade;
