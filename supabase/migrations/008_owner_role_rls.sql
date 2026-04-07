-- Allow owner role to read all shops (they have no shop_id to scope them)
drop policy if exists "shops_select_owner" on public.shops;
create policy "shops_select_owner" on public.shops
  for select
  using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'owner'
  );
