create table if not exists public.product_prices (
  product_id text primary key,
  price numeric(12, 2) not null check (price >= 0),
  previous_price numeric(12, 2) check (previous_price is null or previous_price >= 0),
  is_published boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.product_prices enable row level security;

revoke all on table public.product_prices from anon, authenticated;
grant select on table public.product_prices to authenticated;

drop policy if exists "verified users can read prices" on public.product_prices;
create policy "verified users can read prices"
  on public.product_prices
  for select
  to authenticated
  using (auth.uid() is not null and is_published);