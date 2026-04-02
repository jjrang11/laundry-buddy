-- ============================================================
-- Laundry Buddy – Initial Schema
-- Run this in the Supabase SQL Editor (supabase.com → SQL Editor)
-- ============================================================

-- Orders table
-- Auth users are managed by Supabase Auth (auth.users)
-- Role is stored in user_metadata: { role: 'admin' | 'staff' }

create table public.orders (
  id               uuid primary key default gen_random_uuid(),
  customer_name    text not null,
  contact_number   text not null,
  order_type       text not null check (order_type in ('pickup', 'walkin')),
  address          text,
  weight           numeric(6,2),
  price_per_kg     numeric(8,2) not null,
  total_price      numeric(10,2) generated always as (weight * price_per_kg) stored,
  notes            text,
  status           text not null default 'New Order',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Settings table (single row — global price per kg)
create table public.settings (
  id           uuid primary key default gen_random_uuid(),
  price_per_kg numeric(8,2) not null default 0,
  updated_at   timestamptz not null default now()
);

-- ============================================================
-- Triggers: auto-update updated_at on row changes
-- ============================================================

create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_orders_updated_at
  before update on public.orders
  for each row execute function public.handle_updated_at();

create trigger trg_settings_updated_at
  before update on public.settings
  for each row execute function public.handle_updated_at();

-- ============================================================
-- Indexes
-- ============================================================

create index idx_orders_status     on public.orders(status);
create index idx_orders_created_at on public.orders(created_at desc);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.orders   enable row level security;
alter table public.settings enable row level security;

-- All authenticated users can read and write orders (admin + staff)
create policy "orders_authenticated_all"
  on public.orders
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- All authenticated users can read settings
create policy "settings_select"
  on public.settings
  for select
  using (auth.role() = 'authenticated');

-- Only admins can update settings
create policy "settings_update_admin"
  on public.settings
  for update
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- ============================================================
-- Realtime: enable on orders so dashboard gets live updates
-- ============================================================

alter publication supabase_realtime add table public.orders;

-- ============================================================
-- Seed: initial settings row (₱80/kg default)
-- ============================================================

insert into public.settings (price_per_kg) values (80);
