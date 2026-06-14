-- ============================================================================
-- TrackBook — Follow-ups Table Migration
-- Run this in your Supabase project's SQL Editor
-- This adds a follow_ups table for tracking calls, reminders, and snooze dates.
-- ============================================================================

-- ── follow_ups ──────────────────────────────────────────────────────────────
create table if not exists public.follow_ups (
  id               bigint generated always as identity primary key,
  business_id      text not null references public.businesses(id) on delete cascade,
  customer_id      bigint not null references public.customers(id) on delete cascade,
  type             text not null default 'call'
    check (type in ('call', 'whatsapp', 'note', 'snooze')),
  note             text not null default '',
  snooze_until     date,                          -- if set, hide from due list until this date
  created_at       timestamptz not null default now()
);

-- ── Indexes ──────────────────────────────────────────────────────────────────
create index if not exists idx_follow_ups_business on public.follow_ups(business_id);
create index if not exists idx_follow_ups_customer on public.follow_ups(customer_id);
create index if not exists idx_follow_ups_snooze on public.follow_ups(snooze_until)
  where snooze_until is not null;

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.follow_ups enable row level security;

create policy "follow_ups_owner_select"
  on public.follow_ups for select
  using (business_id = auth.uid()::text);

create policy "follow_ups_owner_insert"
  on public.follow_ups for insert
  with check (business_id = auth.uid()::text);

-- ── Realtime ─────────────────────────────────────────────────────────────────
alter publication supabase_realtime add table public.follow_ups;
