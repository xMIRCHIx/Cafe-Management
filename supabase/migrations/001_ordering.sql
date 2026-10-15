begin;
create table if not exists public.cafe_menu (
  id text primary key, name text not null, price integer not null check (price > 0), available boolean not null default true
);
insert into public.cafe_menu(id,name,price) values
('p1','Truffle Mushroom Pizza',349),('p2','Noiric Loaded Pizza',399),
('b1','Smoked Avocado Burger',249),('b2','Espresso BBQ Chicken Burger',289),
('f1','Parmesan Truffle Fries',179),('f2','Peri-Peri Fries',149),
('dr1','White Velvet Frappe',219),('dr2','Salted Caramel Frappe',239)
on conflict(id) do nothing;
create table if not exists public.cafe_orders (
  id uuid primary key default gen_random_uuid(), number bigint generated always as identity,
  guest_hash text not null, request_id uuid not null, seat integer not null check(seat between 1 and 100),
  customer_name text not null check(length(customer_name) between 1 and 60), notes text not null default '' check(length(notes)<=400),
  status text not null default 'received' check(status in ('received','preparing','ready','served','cancelled')),
  items jsonb not null, total integer not null check(total > 0), created_at timestamptz not null default now(),
  unique(guest_hash,request_id)
);
create index if not exists cafe_orders_guest_idx on public.cafe_orders(guest_hash,created_at desc);
create index if not exists cafe_orders_status_idx on public.cafe_orders(status,created_at);
alter table public.cafe_menu enable row level security;
alter table public.cafe_orders enable row level security;
revoke all on public.cafe_menu,public.cafe_orders from anon, authenticated;
grant all on public.cafe_menu,public.cafe_orders to service_role;
grant usage,select on sequence public.cafe_orders_number_seq to service_role;

create or replace function public.place_cafe_order(p_guest text,p_request uuid,p_seat integer,p_name text,p_notes text,p_items jsonb)
returns uuid language plpgsql security invoker set search_path=public as $$
declare existing uuid; result uuid; line jsonb; product public.cafe_menu; qty integer; total_cost integer:=0; snapshots jsonb:='[]'::jsonb;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_guest,0));
  select id into existing from public.cafe_orders where guest_hash=p_guest and request_id=p_request;
  if existing is not null then return existing; end if;
  if length(p_guest)<>64 or p_seat not between 1 and 100 or length(trim(p_name)) not between 1 and 60 or length(p_notes)>400 then raise exception 'Invalid order details.'; end if;
  if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items) not between 1 and 20 then raise exception 'Please check your cart.'; end if;
  if (select count(*) from public.cafe_orders where guest_hash=p_guest and created_at>now()-interval '1 minute') >= 3 then raise exception 'Please wait a minute before placing another order.'; end if;
  if (select count(distinct value->>'id') from jsonb_array_elements(p_items)) <> jsonb_array_length(p_items) then raise exception 'Duplicate cart items.'; end if;
  for line in select * from jsonb_array_elements(p_items) loop
    if coalesce(line->>'quantity','') !~ '^[0-9]+$' then raise exception 'Invalid quantity.'; end if;
    qty:=(line->>'quantity')::integer;
    if qty not between 1 and 10 then raise exception 'Choose between 1 and 10 of each item.'; end if;
    select * into product from public.cafe_menu where id=line->>'id' and available=true for share;
    if not found then raise exception 'An item is no longer available. Please refresh the menu.'; end if;
    total_cost:=total_cost+product.price*qty;
    snapshots:=snapshots||jsonb_build_array(jsonb_build_object('id',product.id,'name',product.name,'price',product.price,'quantity',qty));
  end loop;
  insert into public.cafe_orders(guest_hash,request_id,seat,customer_name,notes,items,total)
  values(p_guest,p_request,p_seat,trim(p_name),p_notes,snapshots,total_cost) returning id into result;
  return result;
end $$;
revoke all on function public.place_cafe_order(text,uuid,integer,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.place_cafe_order(text,uuid,integer,text,text,jsonb) to service_role;
notify pgrst,'reload schema';
commit;
