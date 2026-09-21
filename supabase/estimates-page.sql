-- =====================================================================
-- J.B. Pressure Washing — Ops App
-- Estimates page: numbering, type, and the Draft/Open/Accepted/
-- Schedule/Declined/Paid/Archive pipeline.
--
-- Safe to run more than once. Paste the whole file into
-- Supabase -> SQL Editor -> New query -> Run.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. New columns on quotes
-- ---------------------------------------------------------------------
alter table public.quotes
  add column if not exists quote_number     integer,
  add column if not exists quote_type       text not null default 'Standard',
  add column if not exists archived_at      timestamptz,
  add column if not exists declined_at      timestamptz,
  add column if not exists paid_at          timestamptz,
  add column if not exists scheduled_job_id uuid references public.jobs(id) on delete set null;

-- Only the two card types the Estimates page knows how to draw.
do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conname = 'quotes_quote_type_check'
       and conrelid = 'public.quotes'::regclass
  ) then
    alter table public.quotes
      add constraint quotes_quote_type_check
      check (quote_type in ('Standard', 'Options'));
  end if;
end $$;


-- ---------------------------------------------------------------------
-- 2. Estimate numbers (the "#310" on each card)
--    Existing rows get numbered in the order they were created.
-- ---------------------------------------------------------------------
with ordered as (
  select id,
         row_number() over (order by coalesce(created_at, now()), id) as rn
    from public.quotes
   where quote_number is null
)
update public.quotes q
   set quote_number = o.rn
  from ordered o
 where o.id = q.id;

create sequence if not exists public.quotes_number_seq;

-- Next new estimate picks up after the highest number already used.
select setval(
  'public.quotes_number_seq',
  greatest(coalesce((select max(quote_number) from public.quotes), 0), 1)
);

alter table public.quotes
  alter column quote_number set default nextval('public.quotes_number_seq');

create unique index if not exists quotes_quote_number_key
  on public.quotes (quote_number);

-- OPTIONAL — to carry on from QuoteIQ's numbering instead of starting at 1,
-- uncomment the next line and set it to your last QuoteIQ estimate number.
-- select setval('public.quotes_number_seq', 310);


-- ---------------------------------------------------------------------
-- 3. Comments
--    "Add Comment" writes into the activity log that estimate-links.sql
--    already created, as event_type = 'comment'. Nothing new is needed
--    here — this block only documents that.
-- ---------------------------------------------------------------------
create index if not exists quote_events_type_idx
  on public.quote_events (event_type);


-- ---------------------------------------------------------------------
-- 4. Helpful indexes for the Estimates list
-- ---------------------------------------------------------------------
create index if not exists quotes_sent_at_idx     on public.quotes (sent_at desc);
create index if not exists quotes_archived_at_idx on public.quotes (archived_at);
