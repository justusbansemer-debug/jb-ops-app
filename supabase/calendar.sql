-- =====================================================================
-- J.B. Pressure Washing — Ops App
-- Google Calendar: a private subscribe feed of your scheduled jobs,
-- plus a per-job length so events have a real end time.
--
-- Run this AFTER the other migrations.
-- Safe to run more than once. Supabase → SQL Editor → New query → Run.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. How long each job blocks out. You set this when you schedule it.
-- ---------------------------------------------------------------------
alter table public.jobs
  add column if not exists duration_minutes integer;

update public.jobs
   set duration_minutes = 120
 where duration_minutes is null;


-- ---------------------------------------------------------------------
-- 2. The secret in your calendar subscribe link. Anyone with this link
--    can see your job schedule, so treat it like a password — and if it
--    ever leaks, run the "reset" line at the bottom of this file.
-- ---------------------------------------------------------------------
alter table public.business_settings
  add column if not exists calendar_token uuid;

update public.business_settings
   set calendar_token = gen_random_uuid()
 where calendar_token is null;

create unique index if not exists business_settings_calendar_token_key
  on public.business_settings (calendar_token);


-- ---------------------------------------------------------------------
-- 3. The only thing the calendar feed can read, and only with the token.
-- ---------------------------------------------------------------------
create or replace function public.get_calendar_jobs(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ok     boolean;
  v_result jsonb;
begin
  select exists (
    select 1 from public.business_settings
     where id = 1 and calendar_token = p_token
  ) into v_ok;

  if not v_ok then
    return null;
  end if;

  select coalesce(jsonb_agg(row_to_json(x)), '[]'::jsonb)
    into v_result
    from (
      select
        j.id,
        j.service_type,
        j.scheduled_at,
        coalesce(j.duration_minutes, 120) as duration_minutes,
        j.status,
        j.price,
        j.notes,
        j.assigned_employee,
        c.first_name,
        c.last_name,
        c.company,
        c.phone,
        c.street_address,
        c.city,
        c.state,
        c.zip
      from public.jobs j
      left join public.customers c on c.id = j.customer_id
      where j.scheduled_at is not null
        and j.scheduled_at > now() - interval '120 days'
        and coalesce(j.status, '') <> 'Cancelled'
      order by j.scheduled_at
    ) x;

  return v_result;
end $$;

revoke all on function public.get_calendar_jobs(uuid) from public;
grant execute on function public.get_calendar_jobs(uuid) to anon, authenticated;


-- ---------------------------------------------------------------------
-- If your calendar link ever gets out, run just this line to kill the old
-- one. You'll then need to re-subscribe with the new link from Settings.
-- ---------------------------------------------------------------------
-- update public.business_settings set calendar_token = gen_random_uuid() where id = 1;
