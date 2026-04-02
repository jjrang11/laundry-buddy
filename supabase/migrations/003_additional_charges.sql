-- Catalog of named charges (admin-managed)
create table public.additional_charges (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  amount     numeric(8,2) not null check (amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_additional_charges_updated_at
  before update on public.additional_charges
  for each row execute function public.handle_updated_at();

-- Snapshot of charges applied to an order (name + amount copied at save time)
create table public.order_charges (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders(id) on delete cascade,
  charge_name   text not null,
  charge_amount numeric(8,2) not null,
  created_at    timestamptz not null default now()
);

create index idx_order_charges_order_id on public.order_charges(order_id);

-- RLS
alter table public.additional_charges enable row level security;
alter table public.order_charges enable row level security;

-- All authenticated users read the catalog
create policy "charges_select" on public.additional_charges
  for select using (auth.role() = 'authenticated');

-- Only admins write to the catalog
create policy "charges_write_admin" on public.additional_charges
  for all using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- All authenticated users can read/write order_charges (same as orders)
create policy "order_charges_authenticated" on public.order_charges
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
