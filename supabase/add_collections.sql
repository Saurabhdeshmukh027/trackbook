-- ============================================================================
-- TrackBook — Collections Table
-- Run this in your Supabase project's SQL Editor (Dashboard → SQL Editor)
-- Collections = extra per-customer charges (parcel, extra meal, custom items)
-- ============================================================================

create table if not exists public.collections (
  id            bigint generated always as identity primary key,
  business_id   text not null references public.businesses(id) on delete cascade,
  customer_id   bigint references public.customers(id) on delete cascade,
  item          text not null default 'Parcel',
  qty           integer not null default 1 check (qty > 0),
  rate          numeric not null default 0 check (rate >= 0),
  amount        numeric not null default 0 check (amount >= 0),
  paid          boolean not null default false,
  paid_at       timestamptz,
  payment_mode  text not null default 'cash',
  date          timestamptz not null default now(),
  note          text not null default '',
  created_at    timestamptz not null default now()
);

-- Ensure customer_id is nullable (in case the table was created with NOT NULL in a previous run)
alter table public.collections alter column customer_id drop not null;

-- Enable RLS
alter table public.collections enable row level security;

-- Indexes for performance
create index if not exists idx_collections_business on public.collections(business_id);
create index if not exists idx_collections_customer on public.collections(customer_id);
create index if not exists idx_collections_date on public.collections(date);

-- RLS Policies
drop policy if exists "collections_owner_select" on public.collections;
drop policy if exists "collections_owner_insert" on public.collections;
drop policy if exists "collections_owner_update" on public.collections;
drop policy if exists "collections_owner_delete" on public.collections;

create policy "collections_owner_select"
  on public.collections for select
  using (business_id = auth.uid()::text);

create policy "collections_owner_insert"
  on public.collections for insert
  with check (business_id = auth.uid()::text);

create policy "collections_owner_update"
  on public.collections for update
  using (business_id = auth.uid()::text);

create policy "collections_owner_delete"
  on public.collections for delete
  using (business_id = auth.uid()::text);

-- Enable realtime updates
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
      and schemaname = 'public' 
      and tablename = 'collections'
  ) then
    alter publication supabase_realtime add table public.collections;
  end if;
end $$;
