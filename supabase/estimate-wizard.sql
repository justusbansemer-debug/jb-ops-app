-- Estimate wizard: several services on one estimate, plus discount/tax/deposit.
--
-- Run this whole file once in Supabase → SQL Editor → New query → Run.
-- It is safe to run twice; nothing is deleted.

-- 1. The services that make up an estimate ------------------------------------
create table if not exists public.quote_items (
  id           uuid primary key default gen_random_uuid(),
  quote_id     uuid not null references public.quotes(id) on delete cascade,
  service_id   uuid references public.services(id) on delete set null,
  name         text not null,
  pricing_type text not null default 'flat',
  unit_label   text,
  unit_price   numeric(12,2),
  quantity     numeric(12,2),
  amount       numeric(12,2) not null default 0,
  notes        text,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists quote_items_quote_id_idx
  on public.quote_items (quote_id, sort_order);

alter table public.quote_items enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
     where schemaname = 'public'
       and tablename  = 'quote_items'
       and policyname = 'quote_items_authenticated'
  ) then
    create policy quote_items_authenticated
      on public.quote_items
      for all
      to authenticated
      using (true)
      with check (true);
  end if;
end $$;

-- 2. Money fields on the estimate itself --------------------------------------
alter table public.quotes add column if not exists discount   numeric(12,2) not null default 0;
alter table public.quotes add column if not exists tax_rate   numeric(6,3)  not null default 0;
alter table public.quotes add column if not exists deposit    numeric(12,2) not null default 0;
alter table public.quotes add column if not exists subtotal   numeric(12,2);
alter table public.quotes add column if not exists client_message text;

-- 3. Let the customer's estimate page show the line items ---------------------
-- Same locked-down function as before, with the services list added. The
-- customer page still never touches a table directly.
create or replace function public.get_public_quote(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  q     public.quotes%rowtype;
  cust  jsonb;
  items jsonb;
begin
  select * into q from public.quotes where share_token = p_token;
  if not found then
    return null;
  end if;

  select to_jsonb(c) - 'id' - 'created_at' - 'user_id'
    into cust
    from public.customers c
   where c.id = q.customer_id;

  select coalesce(
           jsonb_agg(to_jsonb(i) - 'quote_id' - 'service_id' order by i.sort_order),
           '[]'::jsonb
         )
    into items
    from public.quote_items i
   where i.quote_id = q.id;

  return jsonb_build_object(
    'quote',    to_jsonb(q) - 'share_token',
    'customer', cust,
    'items',    items
  );
end $$;

revoke all on function public.get_public_quote(uuid) from public;
grant execute on function public.get_public_quote(uuid) to anon, authenticated;
