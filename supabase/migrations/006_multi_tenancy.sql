-- ============================================================
-- Laundry Buddy – Multi-Tenancy
-- Adds the shops table, shop_id FK columns on orders /
-- additional_charges / settings, tenant-scoped RLS policies,
-- and a helper function that reads shop_id from the JWT.
-- ============================================================

-- ── Step 1: Helper function ────────────────────────────────────────────────
-- Reads shop_id from the current user's JWT user_metadata so every RLS
-- policy can call it without repeating the JWT extraction expression.

create or replace function public.get_my_shop_id()
returns uuid language sql stable as $$
  select (auth.jwt() -> 'user_metadata' ->> 'shop_id')::uuid
$$;

-- ── Step 2: shops table ────────────────────────────────────────────────────

create table if not exists public.shops (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);

alter table public.shops enable row level security;

drop policy if exists "shops_select_own" on public.shops;
create policy "shops_select_own" on public.shops
  for select
  using (id = get_my_shop_id());

-- ── Step 3: Add shop_id columns (nullable first, so backfill can run) ────────

alter table public.orders
  add column if not exists shop_id uuid references public.shops(id);

alter table public.additional_charges
  add column if not exists shop_id uuid references public.shops(id);

-- ── Step 4: Default shop + backfill all tables ────────────────────────────
-- Generates a real UUID via gen_random_uuid() for the default shop.
-- All three tables are backfilled inside one block so the same id is used.
-- Idempotent: ON CONFLICT DO NOTHING + WHERE shop_id IS NULL guards.

do $$
declare
  default_shop_id uuid;
begin
  insert into public.shops (name)
  values ('Default Shop')
  on conflict do nothing;

  -- Retrieve the earliest shop row (handles both fresh run and re-run)
  select id into default_shop_id
  from public.shops
  order by created_at
  limit 1;

  update public.settings           set shop_id = default_shop_id where shop_id is null;
  update public.orders             set shop_id = default_shop_id where shop_id is null;
  update public.additional_charges set shop_id = default_shop_id where shop_id is null;
end;
$$;

-- ── Step 5: Enforce NOT NULL + FK now that backfill is done ──────────────

alter table public.settings
  alter column shop_id set not null;

do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'fk_settings_shop'
      and table_name = 'settings'
      and table_schema = 'public'
  ) then
    alter table public.settings
      add constraint fk_settings_shop
      foreign key (shop_id) references public.shops(id);
  end if;
end;
$$;

alter table public.orders
  alter column shop_id set not null;

alter table public.additional_charges
  alter column shop_id set not null;

-- ── Step 7: Indexes ────────────────────────────────────────────────────────

create index if not exists idx_orders_shop_id
  on public.orders(shop_id);

create index if not exists idx_additional_charges_shop_id
  on public.additional_charges(shop_id);

-- ── Step 8: Tenant-scoped RLS policies ────────────────────────────────────

-- ── orders ──────────────────────────────────────────────────────────────────
-- Replace the single catch-all "for all" policy with explicit per-operation
-- policies that also enforce shop_id isolation.

drop policy if exists "orders_authenticated_all" on public.orders;

create policy "orders_select_own_shop" on public.orders
  for select
  using (
    auth.role() = 'authenticated'
    and shop_id = get_my_shop_id()
  );

create policy "orders_insert_own_shop" on public.orders
  for insert
  with check (
    auth.role() = 'authenticated'
    and shop_id = get_my_shop_id()
  );

create policy "orders_update_own_shop" on public.orders
  for update
  using (
    auth.role() = 'authenticated'
    and shop_id = get_my_shop_id()
  )
  with check (
    auth.role() = 'authenticated'
    and shop_id = get_my_shop_id()
  );

-- ── settings ─────────────────────────────────────────────────────────────────
-- Extend existing policies with the shop_id guard.

drop policy if exists "settings_select" on public.settings;
create policy "settings_select" on public.settings
  for select
  using (
    auth.role() = 'authenticated'
    and shop_id = get_my_shop_id()
  );

drop policy if exists "settings_update_admin" on public.settings;
create policy "settings_update_admin" on public.settings
  for update
  using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    and shop_id = get_my_shop_id()
  )
  with check (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    and shop_id = get_my_shop_id()
  );

-- ── additional_charges ────────────────────────────────────────────────────────

drop policy if exists "charges_select" on public.additional_charges;
create policy "charges_select" on public.additional_charges
  for select
  using (
    auth.role() = 'authenticated'
    and shop_id = get_my_shop_id()
  );

drop policy if exists "charges_write_admin" on public.additional_charges;
create policy "charges_write_admin" on public.additional_charges
  for all
  using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    and shop_id = get_my_shop_id()
  )
  with check (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    and shop_id = get_my_shop_id()
  );

-- ── order_charges ─────────────────────────────────────────────────────────────
-- Derive shop tenancy from the parent orders row via a subquery.

drop policy if exists "order_charges_authenticated" on public.order_charges;

create policy "order_charges_select_own_shop" on public.order_charges
  for select
  using (
    auth.role() = 'authenticated'
    and exists (
      select 1 from public.orders o
      where o.id = order_id
        and o.shop_id = get_my_shop_id()
    )
  );

create policy "order_charges_insert_own_shop" on public.order_charges
  for insert
  with check (
    auth.role() = 'authenticated'
    and exists (
      select 1 from public.orders o
      where o.id = order_id
        and o.shop_id = get_my_shop_id()
    )
  );

create policy "order_charges_update_own_shop" on public.order_charges
  for update
  using (
    auth.role() = 'authenticated'
    and exists (
      select 1 from public.orders o
      where o.id = order_id
        and o.shop_id = get_my_shop_id()
    )
  )
  with check (
    auth.role() = 'authenticated'
    and exists (
      select 1 from public.orders o
      where o.id = order_id
        and o.shop_id = get_my_shop_id()
    )
  );

create policy "order_charges_delete_own_shop" on public.order_charges
  for delete
  using (
    auth.role() = 'authenticated'
    and exists (
      select 1 from public.orders o
      where o.id = order_id
        and o.shop_id = get_my_shop_id()
    )
  );

-- ── storage.objects (shop-assets bucket) ─────────────────────────────────────
-- Extend admin write policies to restrict access to the shop's own folder.
-- The public read policy requires no change.

drop policy if exists "shop_assets_admin_insert" on storage.objects;
create policy "shop_assets_admin_insert" on storage.objects
  for insert
  with check (
    bucket_id = 'shop-assets'
    and (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    and (storage.foldername(name))[1] = (auth.jwt() -> 'user_metadata' ->> 'shop_id')
  );

drop policy if exists "shop_assets_admin_update" on storage.objects;
create policy "shop_assets_admin_update" on storage.objects
  for update
  using (
    bucket_id = 'shop-assets'
    and (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    and (storage.foldername(name))[1] = (auth.jwt() -> 'user_metadata' ->> 'shop_id')
  );

drop policy if exists "shop_assets_admin_delete" on storage.objects;
create policy "shop_assets_admin_delete" on storage.objects
  for delete
  using (
    bucket_id = 'shop-assets'
    and (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    and (storage.foldername(name))[1] = (auth.jwt() -> 'user_metadata' ->> 'shop_id')
  );
