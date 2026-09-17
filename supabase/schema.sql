-- ============================================================================
-- J.B. Pressure Washing — Ops App Database Schema
-- ============================================================================
-- What this file does: creates the tables that hold your business data —
-- customers, jobs, quotes, and invoices — inside your Supabase project.
--
-- HOW TO RUN THIS:
--   1. Open your project at supabase.com
--   2. Click "SQL Editor" in the left sidebar
--   3. Click "New query"
--   4. Paste this whole file in and click "Run"
-- That's it — your database tables now exist.
-- ============================================================================

-- CUSTOMERS: the master contact list. Every job, quote, and invoice
-- points back to a customer here.
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  company text,                     -- optional, for commercial customers
  phone text,
  email text,
  street_address text,
  city text,
  state text default 'NC',
  zip text,
  county text,
  referral_source text,             -- e.g. Google, Yelp, Referral
  notes text,
  created_at timestamptz default now()
);

-- JOBS: one row per scheduled or completed job.
create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete set null,
  service_type text not null,       -- e.g. House Washing, Roof Washing
  scheduled_at timestamptz,
  status text not null default 'Scheduled',  -- Scheduled, In Progress, Completed, Cancelled
  assigned_employee text,
  price numeric(10,2),
  notes text,
  created_at timestamptz default now()
);

-- QUOTES: estimates you send to customers before a job is booked.
create table if not exists quotes (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete set null,
  service_type text not null,
  date_sent date default current_date,
  amount numeric(10,2),
  status text not null default 'Pending',   -- Pending, Accepted, Declined, Expired
  follow_up_date date,
  notes text,
  created_at timestamptz default now()
);

-- INVOICES: bills sent after a job is done, and whether they've been paid.
create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete set null,
  job_id uuid references jobs(id) on delete set null,
  invoice_date date default current_date,
  due_date date,
  amount numeric(10,2) not null default 0,
  amount_paid numeric(10,2) not null default 0,
  payment_method text,
  notes text,
  created_at timestamptz default now()
);

-- ----------------------------------------------------------------------------
-- Row Level Security (RLS): a safety switch that controls who can read/write
-- each table. Only signed-in users (i.e. you, once you've logged into the
-- app) can read or write anything — a stranger with just the link, and
-- nobody signed in at all, gets nothing back.
--
-- If you're re-running this file on a database that already had the old
-- "wide open" version, this section safely replaces those old rules —
-- nothing else in this file needs to change.
-- ----------------------------------------------------------------------------
alter table customers enable row level security;
alter table jobs enable row level security;
alter table quotes enable row level security;
alter table invoices enable row level security;

drop policy if exists "public_all_customers" on customers;
drop policy if exists "authenticated_all_customers" on customers;
create policy "authenticated_all_customers" on customers
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "public_all_jobs" on jobs;
drop policy if exists "authenticated_all_jobs" on jobs;
create policy "authenticated_all_jobs" on jobs
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "public_all_quotes" on quotes;
drop policy if exists "authenticated_all_quotes" on quotes;
create policy "authenticated_all_quotes" on quotes
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "public_all_invoices" on invoices;
drop policy if exists "authenticated_all_invoices" on invoices;
create policy "authenticated_all_invoices" on invoices
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
