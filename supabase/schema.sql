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

alter table public.product_prices
  add column if not exists product_name text not null default '';

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid not null references auth.users(id),
  customer_email text not null,
  customer_contact_email text not null default '',
  customer_name text not null check (char_length(customer_name) between 2 and 100),
  customer_phone text not null check (char_length(customer_phone) between 7 and 30),
  delivery_method text not null check (delivery_method in ('Coordinar entrega por WhatsApp', 'Retiro en el local')),
  customer_notes text not null default '' check (char_length(customer_notes) <= 500),
  items jsonb not null check (jsonb_typeof(items) = 'array'),
  estimated_total numeric(12, 2) not null check (estimated_total >= 0),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders enable row level security;
revoke all on table public.orders from anon, authenticated;
grant select on table public.orders to authenticated;
grant update (status) on table public.orders to authenticated;

create or replace function public.is_order_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'relive284@gmail.com';
$$;

revoke all on function public.is_order_admin() from public, anon;
grant execute on function public.is_order_admin() to authenticated;

drop policy if exists "customers and Relive can read orders" on public.orders;
create policy "customers and Relive can read orders"
  on public.orders
  for select
  to authenticated
  using (customer_id = auth.uid() or public.is_order_admin());

drop policy if exists "Relive can update order status" on public.orders;
create policy "Relive can update order status"
  on public.orders
  for update
  to authenticated
  using (public.is_order_admin())
  with check (public.is_order_admin());

create or replace function public.set_order_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_order_updated_at on public.orders;
create trigger set_order_updated_at
  before update on public.orders
  for each row execute function public.set_order_updated_at();

create or replace function public.create_order(
  p_customer_name text,
  p_customer_phone text,
  p_contact_email text,
  p_delivery_method text,
  p_customer_notes text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_user_email text;
  v_email_confirmed_at timestamptz;
  v_item jsonb;
  v_product_id text;
  v_product_name text;
  v_quantity integer;
  v_unit_price numeric(12, 2);
  v_total numeric(12, 2) := 0;
  v_order_items jsonb := '[]'::jsonb;
  v_order_id uuid;
  v_order_number text;
begin
  if v_user_id is null then
    raise exception 'Debes iniciar sesión para crear un pedido.' using errcode = '28000';
  end if;

  select email, email_confirmed_at
    into v_user_email, v_email_confirmed_at
    from auth.users
    where id = v_user_id;

  if v_user_email is null or v_email_confirmed_at is null then
    raise exception 'Debes verificar tu email antes de crear un pedido.' using errcode = '28000';
  end if;

  if p_customer_name is null or char_length(btrim(p_customer_name)) not between 2 and 100 then
    raise exception 'El nombre debe tener entre 2 y 100 caracteres.' using errcode = '22023';
  end if;
  if p_customer_phone is null or char_length(btrim(p_customer_phone)) not between 7 and 30 then
    raise exception 'El teléfono no es válido.' using errcode = '22023';
  end if;
  if p_delivery_method not in ('Coordinar entrega por WhatsApp', 'Retiro en el local') then
    raise exception 'El método de entrega no es válido.' using errcode = '22023';
  end if;
  if char_length(coalesce(p_customer_notes, '')) > 500 then
    raise exception 'Las indicaciones superan el máximo permitido.' using errcode = '22023';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'El pedido no contiene una lista válida de productos.' using errcode = '22023';
  end if;
  if jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 50 then
    raise exception 'El pedido debe contener entre 1 y 50 productos.' using errcode = '22023';
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_product_id := nullif(btrim(v_item ->> 'product_id'), '');
    if v_product_id is null or coalesce(v_item ->> 'quantity', '') !~ '^[1-9][0-9]{0,2}$' then
      raise exception 'Hay un producto o cantidad inválidos.' using errcode = '22023';
    end if;
    v_quantity := (v_item ->> 'quantity')::integer;

    select product_name, price
      into v_product_name, v_unit_price
      from public.product_prices
      where product_id = v_product_id and is_published;

    if not found then
      raise exception 'Un producto ya no está disponible.' using errcode = '22023';
    end if;

    v_total := v_total + (v_unit_price * v_quantity);
    v_order_items := v_order_items || jsonb_build_array(jsonb_build_object(
      'product_id', v_product_id,
      'name', coalesce(nullif(v_product_name, ''), v_product_id),
      'quantity', v_quantity,
      'unit_price', v_unit_price,
      'line_total', v_unit_price * v_quantity
    ));
  end loop;

  v_order_number := 'REL-' || to_char(now(), 'YYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  insert into public.orders (
    order_number,
    customer_id,
    customer_email,
    customer_contact_email,
    customer_name,
    customer_phone,
    delivery_method,
    customer_notes,
    items,
    estimated_total
  ) values (
    v_order_number,
    v_user_id,
    v_user_email,
    coalesce(btrim(p_contact_email), ''),
    btrim(p_customer_name),
    btrim(p_customer_phone),
    p_delivery_method,
    coalesce(btrim(p_customer_notes), ''),
    v_order_items,
    v_total
  ) returning id into v_order_id;

  return jsonb_build_object(
    'id', v_order_id,
    'order_number', v_order_number,
    'items', v_order_items,
    'estimated_total', v_total
  );
end;
$$;

revoke all on function public.create_order(text, text, text, text, text, jsonb) from public, anon;
grant execute on function public.create_order(text, text, text, text, text, jsonb) to authenticated;