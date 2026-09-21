-- =====================================================================
-- J.B. Pressure Washing — Ops App
-- Terms & conditions you pick per estimate, plus the customer's
-- electronic signature.
--
-- Run this AFTER estimate-links.sql and menu-services-settings.sql.
-- Safe to run more than once. Supabase → SQL Editor → New query → Run.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Your terms templates — write as many as you want, pick one per
--    estimate. Editing a template later never changes an estimate you
--    already sent: the wording is copied onto the quote at send time.
-- ---------------------------------------------------------------------
create table if not exists public.terms_templates (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  body       text not null,
  is_default boolean not null default false,
  active     boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists terms_templates_sort_idx
  on public.terms_templates (active desc, sort_order, name);

alter table public.terms_templates enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'terms_templates'
       and policyname = 'terms_templates_owner_all'
  ) then
    create policy terms_templates_owner_all on public.terms_templates
      for all to authenticated using (true) with check (true);
  end if;
end $$;

-- Only one template can be the default.
create unique index if not exists terms_templates_one_default
  on public.terms_templates (is_default)
  where is_default;


-- ---------------------------------------------------------------------
-- 2. What gets recorded on the quote itself
-- ---------------------------------------------------------------------
alter table public.quotes
  add column if not exists terms_id          uuid,
  add column if not exists terms_text        text,
  add column if not exists signed_name       text,
  add column if not exists signature_data    text,
  add column if not exists signed_at         timestamptz,
  add column if not exists signed_user_agent text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conname = 'quotes_terms_id_fkey'
       and conrelid = 'public.quotes'::regclass
  ) then
    alter table public.quotes
      add constraint quotes_terms_id_fkey
      foreign key (terms_id) references public.terms_templates(id)
      on delete set null;
  end if;
end $$;


-- ---------------------------------------------------------------------
-- 3. Accepting now carries the signature.
--
--    If the estimate has terms attached, an "accepted" response is
--    refused unless a typed name and a drawn signature come with it —
--    so an acceptance on record always has an agreement behind it.
-- ---------------------------------------------------------------------
drop function if exists public.respond_to_quote(uuid, text, text);

create or replace function public.respond_to_quote(
  p_token       uuid,
  p_response    text,
  p_note        text default null,
  p_signed_name text default null,
  p_signature   text default null,
  p_user_agent  text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id    public.quotes.id%type;
  v_terms text;
  v_note  text;
  v_name  text;
  v_sig   text;
begin
  if p_response not in ('accepted', 'declined', 'change_requested') then
    raise exception 'Invalid response';
  end if;

  select id, terms_text into v_id, v_terms
    from public.quotes
   where share_token = p_token;

  if v_id is null then
    raise exception 'Estimate not found';
  end if;

  v_note := nullif(btrim(coalesce(p_note, '')), '');
  if v_note is not null then
    v_note := left(v_note, 2000);
  end if;

  v_name := nullif(btrim(coalesce(p_signed_name, '')), '');
  v_sig  := nullif(btrim(coalesce(p_signature, '')), '');

  if p_response = 'accepted' and nullif(btrim(coalesce(v_terms, '')), '') is not null then
    if v_name is null or v_sig is null then
      raise exception 'A signature is required to accept this estimate';
    end if;
  end if;

  update public.quotes
     set customer_response   = p_response,
         responded_at        = now(),
         change_request_note = case
                                 when p_response = 'change_requested' then v_note
                                 else change_request_note
                               end,
         signed_name         = case when p_response = 'accepted' then left(v_name, 200) else signed_name end,
         signature_data      = case when p_response = 'accepted' then left(v_sig, 400000) else signature_data end,
         signed_at           = case when p_response = 'accepted' and v_sig is not null then now() else signed_at end,
         signed_user_agent   = case when p_response = 'accepted' then left(nullif(btrim(coalesce(p_user_agent, '')), ''), 400) else signed_user_agent end,
         status              = case
                                 when p_response = 'accepted' then 'Accepted'
                                 when p_response = 'declined' then 'Declined'
                                 else status
                               end
   where id = v_id;

  insert into public.quote_events (quote_id, event_type, note)
  values (
    v_id,
    p_response,
    case
      when p_response = 'change_requested' then v_note
      when p_response = 'accepted' and v_name is not null then 'Signed by ' || v_name
      else null
    end
  );

  return jsonb_build_object('ok', true, 'response', p_response);
end $$;

revoke all on function public.respond_to_quote(uuid, text, text, text, text, text) from public;
grant execute on function public.respond_to_quote(uuid, text, text, text, text, text) to anon, authenticated;
