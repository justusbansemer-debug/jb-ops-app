-- =====================================================================
-- J.B. Pressure Washing — Ops App
-- Saved service list + business settings
--
-- Run this AFTER estimate-links.sql.
-- Safe to run more than once. Supabase → SQL Editor → New query → Run.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Saved services — you build each one yourself in Settings
-- ---------------------------------------------------------------------
create table if not exists public.services (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  description   text,
  pricing_type  text not null default 'flat',
  price         numeric(12,2),
  price_max     numeric(12,2),
  unit_label    text,
  default_notes text,
  active        boolean not null default true,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);

-- flat      = one set price
-- per_unit  = price x quantity (sq ft, windows, linear ft — you name the unit)
-- hourly    = price per hour
-- range     = price to price_max
-- custom    = no set price, you type it on each estimate
do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conname = 'services_pricing_type_check'
       and conrelid = 'public.services'::regclass
  ) then
    alter table public.services
      add constraint services_pricing_type_check
      check (pricing_type in ('flat', 'per_unit', 'hourly', 'range', 'custom'));
  end if;
end $$;

create index if not exists services_sort_idx
  on public.services (active desc, sort_order, name);

alter table public.services enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'services'
       and policyname = 'services_owner_all'
  ) then
    create policy services_owner_all on public.services
      for all to authenticated using (true) with check (true);
  end if;
end $$;


-- ---------------------------------------------------------------------
-- 2. Business settings — one row, edited in Settings.
--    This is what shows at the bottom of a customer's estimate page.
-- ---------------------------------------------------------------------
create table if not exists public.business_settings (
  id              integer primary key default 1,
  business_name   text,
  phone           text,
  email           text,
  website         text,
  address         text,
  estimate_footer text,
  updated_at      timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conname = 'business_settings_single_row'
       and conrelid = 'public.business_settings'::regclass
  ) then
    alter table public.business_settings
      add constraint business_settings_single_row check (id = 1);
  end if;
end $$;

insert into public.business_settings (id, business_name)
values (1, 'J.B. Pressure Washing')
on conflict (id) do nothing;

alter table public.business_settings enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'business_settings'
       and policyname = 'business_settings_owner_all'
  ) then
    create policy business_settings_owner_all on public.business_settings
      for all to authenticated using (true) with check (true);
  end if;
end $$;


-- ---------------------------------------------------------------------
-- 3. Let the customer's estimate page show your business contact info
--    (replaces the version from estimate-links.sql — same security,
--     it just also returns the business block now)
-- ---------------------------------------------------------------------
create or replace function public.get_public_quote(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  q    public.quotes%rowtype;
  cust jsonb;
  biz  jsonb;
begin
  select * into q from public.quotes where share_token = p_token;
  if not found then
    return null;
  end if;

  select to_jsonb(c) - 'id' - 'created_at' - 'user_id'
    into cust
    from public.customers c
   where c.id = q.customer_id;

  select to_jsonb(b) - 'id' - 'updated_at'
    into biz
    from public.business_settings b
   where b.id = 1;

  return jsonb_build_object(
    'quote',    to_jsonb(q) - 'share_token',
    'customer', cust,
    'business', biz
  );
end $$;

revoke all on function public.get_public_quote(uuid) from public;
grant execute on function public.get_public_quote(uuid) to anon, authenticated;
