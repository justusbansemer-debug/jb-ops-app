-- =====================================================================
-- J.B. Pressure Washing — Ops App
-- Estimate share links: send, open-tracking, and customer response
--
-- Safe to run more than once. Paste the whole file into
-- Supabase → SQL Editor → New query → Run.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. New columns on quotes
-- ---------------------------------------------------------------------
alter table public.quotes
  add column if not exists share_token        uuid not null default gen_random_uuid(),
  add column if not exists sent_at            timestamptz,
  add column if not exists first_viewed_at    timestamptz,
  add column if not exists last_viewed_at     timestamptz,
  add column if not exists view_count         integer not null default 0,
  add column if not exists responded_at       timestamptz,
  add column if not exists customer_response  text,
  add column if not exists change_request_note text;

-- Any row that somehow ended up without a token gets one.
update public.quotes
   set share_token = gen_random_uuid()
 where share_token is null;

create unique index if not exists quotes_share_token_key
  on public.quotes (share_token);

-- Only the three responses the customer page offers.
do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conname = 'quotes_customer_response_check'
       and conrelid = 'public.quotes'::regclass
  ) then
    alter table public.quotes
      add constraint quotes_customer_response_check
      check (customer_response is null
             or customer_response in ('accepted', 'declined', 'change_requested'));
  end if;
end $$;


-- ---------------------------------------------------------------------
-- 2. Activity log — one row per thing the customer does
--    (quote_id is created to match whatever type quotes.id already is)
-- ---------------------------------------------------------------------
do $$
declare
  id_type text;
begin
  select format_type(a.atttypid, a.atttypmod)
    into id_type
    from pg_attribute a
   where a.attrelid = 'public.quotes'::regclass
     and a.attname  = 'id'
     and a.attnum   > 0
     and not a.attisdropped;

  execute format($f$
    create table if not exists public.quote_events (
      id          uuid primary key default gen_random_uuid(),
      quote_id    %s not null references public.quotes(id) on delete cascade,
      event_type  text not null,
      note        text,
      created_at  timestamptz not null default now()
    )
  $f$, id_type);
end $$;

create index if not exists quote_events_created_at_idx
  on public.quote_events (created_at desc);
create index if not exists quote_events_quote_id_idx
  on public.quote_events (quote_id);

-- The logged-in owner can read the activity log; nobody else touches it
-- directly (the functions below write it).
alter table public.quote_events enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
     where schemaname = 'public'
       and tablename  = 'quote_events'
       and policyname = 'quote_events_owner_all'
  ) then
    create policy quote_events_owner_all
      on public.quote_events
      for all
      to authenticated
      using (true)
      with check (true);
  end if;
end $$;


-- ---------------------------------------------------------------------
-- 3. Public functions
--
--    The customer is not logged in, so the /e/<token> page cannot read
--    the quotes table directly. These three functions are the only doors
--    open to the public, they each require the secret token, and they
--    never expose anything but the one quote that token belongs to.
-- ---------------------------------------------------------------------

-- 3a. Read one estimate by its token.
create or replace function public.get_public_quote(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  q     public.quotes%rowtype;
  cust  jsonb;
begin
  select * into q from public.quotes where share_token = p_token;
  if not found then
    return null;
  end if;

  select to_jsonb(c) - 'id' - 'created_at' - 'user_id'
    into cust
    from public.customers c
   where c.id = q.customer_id;

  return jsonb_build_object(
    'quote',    to_jsonb(q) - 'share_token',
    'customer', cust
  );
end $$;


-- 3b. Record that the customer opened the link.
create or replace function public.record_quote_view(p_token uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id public.quotes.id%type;
begin
  update public.quotes
     set first_viewed_at = coalesce(first_viewed_at, now()),
         last_viewed_at  = now(),
         view_count      = coalesce(view_count, 0) + 1
   where share_token = p_token
  returning id into v_id;

  if v_id is null then
    return;
  end if;

  -- One activity entry per visit, not one per page refresh.
  if not exists (
    select 1 from public.quote_events e
     where e.quote_id   = v_id
       and e.event_type = 'viewed'
       and e.created_at > now() - interval '30 minutes'
  ) then
    insert into public.quote_events (quote_id, event_type)
    values (v_id, 'viewed');
  end if;
end $$;


-- 3c. Record Accept / Decline / Request a change.
create or replace function public.respond_to_quote(
  p_token    uuid,
  p_response text,
  p_note     text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id   public.quotes.id%type;
  v_note text;
begin
  if p_response not in ('accepted', 'declined', 'change_requested') then
    raise exception 'Invalid response';
  end if;

  v_note := nullif(btrim(coalesce(p_note, '')), '');
  if v_note is not null then
    v_note := left(v_note, 2000);
  end if;

  update public.quotes
     set customer_response   = p_response,
         responded_at        = now(),
         change_request_note = case
                                 when p_response = 'change_requested' then v_note
                                 else change_request_note
                               end,
         -- keep the quote's own status in step with what the customer said
         status              = case
                                 when p_response = 'accepted' then 'Accepted'
                                 when p_response = 'declined' then 'Declined'
                                 else status
                               end
   where share_token = p_token
  returning id into v_id;

  if v_id is null then
    raise exception 'Estimate not found';
  end if;

  insert into public.quote_events (quote_id, event_type, note)
  values (v_id, p_response, v_note);

  return jsonb_build_object('ok', true, 'response', p_response);
end $$;


-- ---------------------------------------------------------------------
-- 4. Grants — the public gets these three functions and nothing else
-- ---------------------------------------------------------------------
revoke all on function public.get_public_quote(uuid)               from public;
revoke all on function public.record_quote_view(uuid)              from public;
revoke all on function public.respond_to_quote(uuid, text, text)   from public;

grant execute on function public.get_public_quote(uuid)             to anon, authenticated;
grant execute on function public.record_quote_view(uuid)            to anon, authenticated;
grant execute on function public.respond_to_quote(uuid, text, text) to anon, authenticated;
