-- ============================================================
-- DeepDive — Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── PROFILES ──────────────────────────────────────────────
-- Extended user profile (linked to auth.users via trigger)
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  full_name    text,
  phone        text,
  avatar_url   text,
  created_at   timestamptz default now()
);

-- Auto-create profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── BOOKINGS ──────────────────────────────────────────────
create table if not exists public.bookings (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid references auth.users(id) on delete cascade,
  -- Personal details (for guest bookings too)
  first_name          text not null,
  last_name           text not null,
  email               text not null,
  phone               text,
  -- Dive details
  destination         text not null,
  island_id           text,          -- slug e.g. "andaman"
  dive_type           text not null,
  experience_level    text not null,
  num_divers          int  default 1,
  preferred_date      date not null,
  -- Package / service
  service_id          text,          -- slug e.g. "coral-reef"
  special_requests    text,
  -- Pricing snapshot
  price_per_person    numeric(10,2),
  total_price         numeric(10,2),
  currency            text default 'INR',
  -- Status
  status              text default 'pending'
                      check (status in ('pending','confirmed','completed','cancelled')),
  -- Timestamps
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists bookings_updated_at on public.bookings;
create trigger bookings_updated_at
  before update on public.bookings
  for each row execute procedure public.set_updated_at();

-- ── ROW LEVEL SECURITY ────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.bookings  enable row level security;

-- Profiles: users can read/update their own row
create policy "profiles: own read"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: own update"
  on public.profiles for update
  using (auth.uid() = id);

-- Bookings: users can read their own bookings
create policy "bookings: own read"
  on public.bookings for select
  using (auth.uid() = user_id);

-- Bookings: authenticated users can insert (user_id must match)
create policy "bookings: insert own"
  on public.bookings for insert
  with check (auth.uid() = user_id);

-- Allow anonymous inserts (guest bookings — user_id can be null)
create policy "bookings: guest insert"
  on public.bookings for insert
  with check (user_id is null);

-- ── INDEXES ───────────────────────────────────────────────
create index if not exists idx_bookings_user_id    on public.bookings(user_id);
create index if not exists idx_bookings_status     on public.bookings(status);
create index if not exists idx_bookings_created_at on public.bookings(created_at desc);

-- ── VIEWS ─────────────────────────────────────────────────
-- Handy view for profile page: user's booking summary
create or replace view public.booking_summary as
select
  b.*,
  p.full_name as profile_name
from public.bookings b
left join public.profiles p on p.id = b.user_id;

-- ── DONE ──────────────────────────────────────────────────
-- After running this, go to:
--   Authentication → Settings → Confirm email: off (for dev)
--   Authentication → URL Configuration → Site URL: your domain
