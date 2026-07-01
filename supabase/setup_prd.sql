-- ============================================================================
-- TrackBook — PRD-Aligned Supabase Setup
-- Run this in your Supabase project's SQL Editor (Dashboard → SQL Editor)
-- WARNING: This drops all existing tables and recreates them.
-- ============================================================================

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  0. DROP EXISTING TABLES (clean slate)                                 ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

drop table if exists public.off_days cascade;
drop table if exists public.meal_pause cascade;
drop table if exists public.payments cascade;
drop table if exists public.members cascade;
drop table if exists public.customers cascade;
drop table if exists public.admins cascade;
drop table if exists public.businesses cascade;

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  1. TABLES                                                             ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- ── businesses ──────────────────────────────────────────────────────────────
create table public.businesses (
  id           text primary key,                -- matches auth.users.id
  owner_name   text not null default '',
  business_name text not null default '',
  mobile       text not null default '',
  email        text not null,
  logo_url     text not null default '',
  status       text not null default 'pending'
    check (status in ('pending', 'active', 'suspended')),
  customer_count integer not null default 0,
  created_at   timestamptz not null default now()
);

-- ── admins ──────────────────────────────────────────────────────────────────
create table public.admins (
  id           bigint generated always as identity primary key,
  user_id      text not null unique,
  created_at   timestamptz not null default now()
);

-- ── customers ───────────────────────────────────────────────────────────────
create table public.customers (
  id                   bigint generated always as identity primary key,
  business_id          text not null references public.businesses(id) on delete cascade,
  name                 text not null,
  mobile               text not null default '',
  address              text not null default '',
  photo_url            text not null default '',
  meal_plan            text not null default 'monthly'
    check (meal_plan in ('monthly', 'quarterly', 'custom')),
  subscription_amount  numeric not null default 0
    check (subscription_amount >= 0),
  subscription_duration integer not null default 30,
  start_date           timestamptz,
  end_date             timestamptz,
  amount_paid          numeric not null default 0
    check (amount_paid >= 0),
  amount_due           numeric not null default 0
    check (amount_due >= 0),
  status               text not null default 'active'
    check (status in ('active', 'due', 'overdue')),
  created_at           timestamptz not null default now()
);

-- ── payments ────────────────────────────────────────────────────────────────
create table public.payments (
  id               bigint generated always as identity primary key,
  business_id      text not null references public.businesses(id) on delete cascade,
  customer_id      bigint not null references public.customers(id) on delete cascade,
  amount           numeric not null default 0
    check (amount >= 0),
  payment_mode     text not null default 'cash'
    check (payment_mode in ('cash', 'upi', 'bank')),
  note             text not null default '',
  date             timestamptz not null default now()
);

-- ── meal_pause ──────────────────────────────────────────────────────────────
create table public.meal_pause (
  id               bigint generated always as identity primary key,
  business_id      text not null references public.businesses(id) on delete cascade,
  customer_id      bigint not null references public.customers(id) on delete cascade,
  from_date        date not null,
  to_date          date not null,
  days             integer not null default 0
    check (days >= 0),
  reason           text not null default '',
  settled          boolean not null default false,
  settled_at       timestamptz,
  created_at       timestamptz not null default now(),
  -- Ensure from <= to
  check (from_date <= to_date)
);

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  2. INDEXES                                                            ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

create index idx_customers_business on public.customers(business_id);
create unique index idx_customers_unique_mobile on public.customers(business_id, mobile) where mobile != '';
create index idx_customers_status on public.customers(status);
create index idx_payments_business on public.payments(business_id);
create index idx_payments_customer on public.payments(customer_id);
create index idx_payments_date on public.payments(date);
create index idx_meal_pause_business on public.meal_pause(business_id);
create index idx_meal_pause_customer on public.meal_pause(customer_id);
create index idx_meal_pause_settled on public.meal_pause(settled);

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  3. HELPER FUNCTIONS                                                   ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- Check if current user is an admin
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.admins where user_id = auth.uid()::text
  );
$$;

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  4. ROW LEVEL SECURITY                                                 ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

alter table public.businesses enable row level security;
alter table public.admins enable row level security;
alter table public.customers enable row level security;
alter table public.payments enable row level security;
alter table public.meal_pause enable row level security;

-- ── businesses policies ─────────────────────────────────────────────────────

-- Owners can read their own business
create policy "business_owner_select"
  on public.businesses for select
  using (id = auth.uid()::text);

-- Owners can update their own business
create policy "business_owner_update"
  on public.businesses for update
  using (id = auth.uid()::text);

-- Owners can insert their own business (on registration)
create policy "business_owner_insert"
  on public.businesses for insert
  with check (id = auth.uid()::text);

-- Admins can read all businesses
create policy "business_admin_select"
  on public.businesses for select
  using (public.is_admin());

-- Admins can update any business (approve, suspend, etc.)
create policy "business_admin_update"
  on public.businesses for update
  using (public.is_admin());

-- ── admins policies ─────────────────────────────────────────────────────────

-- Admins can read their own record
create policy "admins_self_select"
  on public.admins for select
  using (user_id = auth.uid()::text);

-- ── customers policies ──────────────────────────────────────────────────────

create policy "customers_owner_select"
  on public.customers for select
  using (business_id = auth.uid()::text);

create policy "customers_owner_insert"
  on public.customers for insert
  with check (business_id = auth.uid()::text);

create policy "customers_owner_update"
  on public.customers for update
  using (business_id = auth.uid()::text);

create policy "customers_owner_delete"
  on public.customers for delete
  using (business_id = auth.uid()::text);

-- ── payments policies ───────────────────────────────────────────────────────

create policy "payments_owner_select"
  on public.payments for select
  using (business_id = auth.uid()::text);

create policy "payments_owner_insert"
  on public.payments for insert
  with check (business_id = auth.uid()::text);

-- ── meal_pause policies ─────────────────────────────────────────────────────

create policy "meal_pause_owner_select"
  on public.meal_pause for select
  using (business_id = auth.uid()::text);

create policy "meal_pause_owner_insert"
  on public.meal_pause for insert
  with check (business_id = auth.uid()::text);

create policy "meal_pause_owner_update"
  on public.meal_pause for update
  using (business_id = auth.uid()::text);

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  5. STORAGE — avatars bucket                                           ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Drop existing storage policies (idempotent)
drop policy if exists "avatars_public_read" on storage.objects;
drop policy if exists "avatars_owner_insert" on storage.objects;
drop policy if exists "avatars_owner_update" on storage.objects;

-- Anyone can read avatars (public bucket)
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Authenticated users can upload to their own business folder
create policy "avatars_owner_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = 'businesses'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

-- Authenticated users can overwrite their own photos
create policy "avatars_owner_update"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = 'businesses'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  6. REALTIME                                                           ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- Remove old tables from realtime publication (ignore errors if not present)
do $$
begin
  execute 'alter publication supabase_realtime drop table if exists public.members';
  execute 'alter publication supabase_realtime drop table if exists public.off_days';
exception when others then null;
end $$;

alter publication supabase_realtime add table public.businesses;
alter publication supabase_realtime add table public.customers;
alter publication supabase_realtime add table public.payments;
alter publication supabase_realtime add table public.meal_pause;

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  7. NOTES                                                              ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- After running this script:
--
-- 1. Disable email confirmation in Supabase Dashboard:
--    Authentication → Providers → Email → Uncheck "Confirm email" → Save
--
-- 2. Create an admin by inserting into the admins table:
--    INSERT INTO public.admins (user_id) VALUES ('<your-user-uuid>');
--    (First register at /register, then get your user ID from auth.users)
--
-- 3. Approve the admin's business:
--    UPDATE public.businesses SET status = 'active' WHERE id = '<your-user-uuid>';
