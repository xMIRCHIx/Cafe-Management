begin;
alter table public.cafe_menu
  add column if not exists category text not null default 'Kitchen',
  add column if not exists description text not null default '',
  add column if not exists image text not null default '/loaded_pizza.png',
  add column if not exists veg boolean not null default true,
  add column if not exists badge text not null default '',
  add column if not exists minutes integer not null default 15 check(minutes between 1 and 180),
  add column if not exists sort_order integer not null default 0,
  add column if not exists archived boolean not null default false;
update public.cafe_menu set category=case when id like 'p%' then 'Pizzas' when id like 'b%' then 'Burgers' when id like 'f%' then 'Sides' else 'Frappes' end,
  image=case when id like 'dr%' then '/premium_frappe.png' when id like 'b%' then 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80' when id like 'f%' then 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80' else '/loaded_pizza.png' end,
  veg=id not in ('p2','b2'), badge=case when id in ('p1','dr1') then 'House favourite' else '' end
where category='Kitchen' and id in ('p1','p2','b1','b2','f1','f2','dr1','dr2');

create table if not exists public.cafe_settings (
  id integer primary key default 1 check(id=1), cafe_name text not null default 'NOIRIC',
  tagline text not null default 'Your table. Your time.', announcement text not null default '',
  accent_color text not null default '#b3442d', ordering_open boolean not null default true,
  require_login boolean not null default true, wifi_required boolean not null default false,
  wifi_ssid text not null default '', wifi_password text not null default '', wifi_security text not null default 'WPA',
  wifi_public_ips text[] not null default '{}', discount_percent integer not null default 0 check(discount_percent between 0 and 30),
  reward_item_id text references public.cafe_menu(id) on delete set null
);
insert into public.cafe_settings(id) values(1) on conflict do nothing;
create table if not exists public.cafe_seats (
  id uuid primary key default gen_random_uuid(), number integer not null unique check(number between 1 and 100),
  label text not null default '', code uuid not null unique default gen_random_uuid(), active boolean not null default true
);
insert into public.cafe_seats(number,label) select n,'Seat '||n from generate_series(1,12) n on conflict(number) do nothing;
create table if not exists public.cafe_customers (
  id uuid primary key references auth.users(id) on delete cascade, name text not null default '',
  email text, phone text, strikes integer not null default 0, blocked_until timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists public.cafe_rewards (
  id uuid primary key default gen_random_uuid(), customer_id uuid not null references public.cafe_customers(id),
  earned_at timestamptz not null default now(), expires_at timestamptz not null default now()+interval '30 days',
  order_id uuid references public.cafe_orders(id), state text not null default 'available' check(state in ('available','reserved','redeemed'))
);
create table if not exists public.cafe_visits (
  id uuid primary key default gen_random_uuid(), customer_id uuid not null references public.cafe_customers(id),
  visit_day date not null, order_id uuid not null references public.cafe_orders(id), reward_id uuid references public.cafe_rewards(id),
  unique(customer_id,visit_day)
);
alter table public.cafe_orders
  add column if not exists customer_id uuid references public.cafe_customers(id),
  add column if not exists subtotal integer not null default 0,
  add column if not exists discount integer not null default 0,
  add column if not exists reward_id uuid references public.cafe_rewards(id),
  add column if not exists paid boolean not null default false,
  add column if not exists paid_at timestamptz,
  add column if not exists seat_verified boolean not null default false,
  add column if not exists rejection_reason text not null default '';
alter table public.cafe_orders drop constraint if exists cafe_orders_total_check;
alter table public.cafe_orders add constraint cafe_orders_total_check check(total>=0);
update public.cafe_orders set subtotal=total where subtotal=0;
create unique index if not exists cafe_orders_customer_request on public.cafe_orders(customer_id,request_id) where customer_id is not null;
create index if not exists cafe_orders_customer on public.cafe_orders(customer_id,created_at desc);
create table if not exists public.cafe_tracks (
  id uuid primary key default gen_random_uuid(), title text not null, artist text not null default '', video_id text not null,
  status text not null default 'queued' check(status in ('queued','playing','played','removed')), created_at timestamptz not null default now()
);
create unique index if not exists cafe_one_playing_track on public.cafe_tracks(status) where status='playing';
create table if not exists public.cafe_votes (
  track_id uuid not null references public.cafe_tracks(id) on delete cascade,
  customer_id uuid not null references public.cafe_customers(id) on delete cascade,
  created_at timestamptz not null default now(), primary key(track_id,customer_id)
);

-- Every mutation is made by the authenticated Next server. No anonymous table access.
do $$ declare t text; begin
  foreach t in array array['cafe_settings','cafe_seats','cafe_customers','cafe_rewards','cafe_visits','cafe_tracks','cafe_votes'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from anon,authenticated',t);
    execute format('grant all on public.%I to service_role',t);
  end loop;
end $$;

create or replace function public.submit_cafe_order(p_guest text,p_customer uuid,p_request uuid,p_code uuid,p_name text,p_notes text,p_items jsonb,p_reward boolean default false)
returns uuid language plpgsql security invoker set search_path=public as $$
declare existing uuid; result uuid; line jsonb; product public.cafe_menu; qty integer; cost integer:=0; reduction integer:=0;
  snapshots jsonb:='[]'; config public.cafe_settings; seat_row public.cafe_seats; reward uuid; reward_price integer:=0; owner public.cafe_customers;
begin
  perform pg_advisory_xact_lock(hashtextextended(coalesce(p_customer::text,p_guest),0));
  select id into existing from public.cafe_orders where request_id=p_request and ((p_customer is not null and customer_id=p_customer) or (p_customer is null and guest_hash=p_guest));
  if existing is not null then return existing; end if;
  select * into config from public.cafe_settings where id=1;
  if not config.ordering_open then raise exception 'The kitchen is taking a short break. Please try later.'; end if;
  if config.require_login and p_customer is null then raise exception 'Sign in to place your order.'; end if;
  select * into seat_row from public.cafe_seats where code=p_code and active;
  if not found then raise exception 'This seat QR is no longer active. Please scan the QR on your table.'; end if;
  if p_customer is not null then
    select * into owner from public.cafe_customers where id=p_customer;
    if not found then raise exception 'Please sign in again.'; end if;
    if owner.blocked_until>now() then raise exception 'Ordering is paused for this account. Please speak with our team.'; end if;
  end if;
  if p_guest is null or length(p_guest)<>64 or length(trim(p_name)) not between 1 and 60 or length(p_notes)>400 then raise exception 'Please check your order details.'; end if;
  if p_items is null or jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items) not between 1 and 30 then raise exception 'Please check your cart.'; end if;
  if (select count(*) from public.cafe_orders where ((p_customer is not null and customer_id=p_customer) or guest_hash=p_guest) and created_at>now()-interval '1 minute')>=3 then raise exception 'Please wait a minute before ordering again.'; end if;
  if (select count(distinct value->>'id') from jsonb_array_elements(p_items))<>jsonb_array_length(p_items) then raise exception 'Duplicate cart items.'; end if;
  for line in select * from jsonb_array_elements(p_items) loop
    if coalesce(line->>'quantity','') !~ '^[0-9]+$' then raise exception 'Invalid quantity.'; end if;
    qty:=(line->>'quantity')::integer;
    if qty not between 1 and 10 then raise exception 'Choose up to ten of each item.'; end if;
    select * into product from public.cafe_menu where id=line->>'id' and available and not archived for share;
    if not found then raise exception 'An item is unavailable. Refresh the menu and check your cart.'; end if;
    cost:=cost+product.price*qty;
    if product.id=config.reward_item_id then reward_price:=product.price; end if;
    snapshots:=snapshots||jsonb_build_array(jsonb_build_object('id',product.id,'name',product.name,'price',product.price,'quantity',qty));
  end loop;
  if p_reward then
    if p_customer is null or reward_price=0 then raise exception 'Add the eligible reward item to your cart first.'; end if;
    select id into reward from public.cafe_rewards where customer_id=p_customer and state='available' and expires_at>now() order by expires_at limit 1 for update;
    if reward is null then raise exception 'No available reward. Please refresh your rewards.'; end if;
    reduction:=reward_price;
  elsif p_customer is not null and exists(select 1 from public.cafe_visits where customer_id=p_customer and visit_day>=(now() at time zone 'Asia/Kolkata')::date-29 and visit_day<(now() at time zone 'Asia/Kolkata')::date) then
    reduction:=round(cost*config.discount_percent/100.0);
  end if;
  insert into public.cafe_orders(guest_hash,customer_id,request_id,seat,customer_name,notes,items,total,subtotal,discount,reward_id)
  values(p_guest,p_customer,p_request,seat_row.number,trim(p_name),p_notes,snapshots,cost-reduction,cost,reduction,reward) returning id into result;
  if reward is not null then update public.cafe_rewards set state='reserved',order_id=result where id=reward; end if;
  return result;
end $$;
revoke all on function public.submit_cafe_order(text,uuid,uuid,uuid,text,text,jsonb,boolean) from public,anon,authenticated;
grant execute on function public.submit_cafe_order(text,uuid,uuid,uuid,text,text,jsonb,boolean) to service_role;

create or replace function public.update_cafe_order(p_id uuid,p_action text,p_verified boolean default false,p_reason text default '')
returns void language plpgsql security invoker set search_path=public as $$
declare o public.cafe_orders; reward uuid; today date:=(now() at time zone 'Asia/Kolkata')::date;
begin
  select * into o from public.cafe_orders where id=p_id for update;
  if not found then raise exception 'Order not found.'; end if;
  if p_action='preparing' and o.status='received' and p_verified then update public.cafe_orders set status='preparing',seat_verified=true where id=p_id;
  elsif p_action='ready' and o.status='preparing' then update public.cafe_orders set status='ready' where id=p_id;
  elsif p_action='served' and o.status='ready' then update public.cafe_orders set status='served' where id=p_id;
  elsif p_action='paid' and o.status<>'cancelled' and not o.paid then update public.cafe_orders set paid=true,paid_at=now() where id=p_id;
  elsif p_action='cancelled' and o.status in ('received','preparing','ready') and not o.paid and length(trim(p_reason)) between 3 and 200 then
    update public.cafe_orders set status='cancelled',rejection_reason=p_reason where id=p_id;
    update public.cafe_rewards set state='available',order_id=null where order_id=p_id and state='reserved';
  else raise exception 'Order changed or confirmation is missing. Refresh and try again.';
  end if;
  select * into o from public.cafe_orders where id=p_id;
  if o.status='served' and o.paid then
    update public.cafe_rewards set state='redeemed' where order_id=p_id and state='reserved';
    if o.customer_id is not null and o.total>0 then
      perform pg_advisory_xact_lock(hashtextextended(o.customer_id::text,1));
      insert into public.cafe_visits(customer_id,visit_day,order_id) values(o.customer_id,today,p_id) on conflict(customer_id,visit_day) do nothing;
      if (select count(*) from public.cafe_visits where customer_id=o.customer_id and reward_id is null and visit_day>=today-29)>=5 then
        insert into public.cafe_rewards(customer_id) values(o.customer_id) returning id into reward;
        update public.cafe_visits set reward_id=reward where id in (select id from public.cafe_visits where customer_id=o.customer_id and reward_id is null and visit_day>=today-29 order by visit_day limit 5);
      end if;
    end if;
  end if;
end $$;
revoke all on function public.update_cafe_order(uuid,text,boolean,text) from public,anon,authenticated;
grant execute on function public.update_cafe_order(uuid,text,boolean,text) to service_role;

create or replace function public.play_cafe_track(p_id uuid) returns void language plpgsql security invoker set search_path=public as $$
begin
  perform pg_advisory_xact_lock(70021);
  if not exists(select 1 from public.cafe_tracks where id=p_id and status in ('queued','playing')) then raise exception 'This track is no longer queued.'; end if;
  update public.cafe_tracks set status='played' where status='playing' and id<>p_id;
  update public.cafe_tracks set status='playing' where id=p_id;
end $$;
revoke all on function public.play_cafe_track(uuid) from public,anon,authenticated;
grant execute on function public.play_cafe_track(uuid) to service_role;
notify pgrst,'reload schema';
commit;
