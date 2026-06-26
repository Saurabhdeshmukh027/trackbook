-- Create public.expenses table
create table if not exists public.expenses (
  id            bigint generated always as identity primary key,
  business_id   text not null references public.businesses(id) on delete cascade,
  title         text not null default '',
  amount        numeric not null default 0 check (amount >= 0),
  category      text not null default 'other'
    check (category in ('rent', 'salary', 'groceries', 'gas', 'transport', 'utilities', 'maintenance', 'other')),
  date          timestamptz not null default now(),
  note          text not null default '',
  created_at    timestamptz not null default now()
);

-- Enable RLS
alter table public.expenses enable row level security;

-- Index for performance
create index if not exists idx_expenses_business on public.expenses(business_id);
create index if not exists idx_expenses_date on public.expenses(date);

-- RLS policies
create policy "expenses_owner_select"
  on public.expenses for select
  using (business_id = auth.uid()::text);

create policy "expenses_owner_insert"
  on public.expenses for insert
  with check (business_id = auth.uid()::text);

create policy "expenses_owner_update"
  on public.expenses for update
  using (business_id = auth.uid()::text);

create policy "expenses_owner_delete"
  on public.expenses for delete
  using (business_id = auth.uid()::text);

-- Enable realtime
alter publication supabase_realtime add table public.expenses;
