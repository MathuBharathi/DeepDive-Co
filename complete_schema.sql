-- ============================================================
-- DeepDive — Complete Unified Database Schema
-- Run this ONCE in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ── 0. CLEAN RESET: DROP EXISTING TABLES, VIEWS & FUNCTIONS ──
drop view if exists public.booking_summary cascade;
drop table if exists public.closed_dates cascade;
drop table if exists public.reviews cascade;
drop table if exists public.bookings cascade;
drop table if exists public.profiles cascade;

drop function if exists public.handle_new_user() cascade;
drop function if exists public.set_updated_at() cascade;
drop function if exists public.is_admin(uuid) cascade;

-- ── 1. ENABLE UUID EXTENSION ──────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── 2. PROFILES TABLE ──────────────────────────────────────────
-- Extended user profile linked to auth.users
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  full_name    text,
  email        text,
  phone        text,
  avatar_url   text,
  is_admin     boolean not null default false,
  created_at   timestamptz default now()
);

-- Auto-create profile row on new user sign up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, email, is_admin)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    false
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    email     = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Backfill profile email for existing users
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id
  and p.email is distinct from u.email;

-- To promote a user to Admin, execute:
-- UPDATE public.profiles SET is_admin = true WHERE email = 'your-admin-email@example.com';

-- Helper function: check if a user ID is an admin (SECURITY DEFINER avoids RLS recursion)
create or replace function public.is_admin(uid uuid)
returns boolean
language sql security definer stable as $$
  select coalesce((select is_admin from public.profiles where id = uid), false);
$$;

-- ── 3. BOOKINGS TABLE ──────────────────────────────────────────
create table public.bookings (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid references auth.users(id) on delete cascade,
  -- Contact Details
  first_name          text not null,
  last_name           text not null,
  email               text not null,
  phone               text,
  -- Dive Details
  destination         text not null,
  island_id           text,          -- e.g. "andaman"
  dive_type           text not null,
  experience_level    text not null,
  num_divers          int  default 1,
  preferred_date      date not null,
  -- Package / Service
  service_id          text,          -- e.g. "coral-reef"
  special_requests    text,
  -- Pricing
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

-- Trigger to auto-update updated_at timestamp
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

-- ── 4. REVIEWS TABLE ───────────────────────────────────────────
create table public.reviews (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  user_name    text not null,
  rating       int not null check (rating >= 1 and rating <= 5),
  review_text  text not null check (char_length(review_text) >= 10),
  dive_type    text not null,
  created_at   timestamptz default now()
);

-- ── 5. CLOSED DATES TABLE (Admin Blackout Dates) ───────────────
create table public.closed_dates (
  id          uuid primary key default uuid_generate_v4(),
  closed_date date not null unique,
  reason      text,
  closed_by   uuid references auth.users(id),
  created_at  timestamptz default now()
);

-- ── 6. ROW LEVEL SECURITY (RLS) ────────────────────────────────
alter table public.profiles     enable row level security;
alter table public.bookings     enable row level security;
alter table public.reviews      enable row level security;
alter table public.closed_dates  enable row level security;

-- PROFILES Policies
drop policy if exists "profiles: own read" on public.profiles;
create policy "profiles: own read" on public.profiles for select using (auth.uid() = id);

drop policy if exists "profiles: own update" on public.profiles;
create policy "profiles: own update" on public.profiles for update using (auth.uid() = id);

drop policy if exists "profiles: admin read all" on public.profiles;
create policy "profiles: admin read all" on public.profiles for select using (public.is_admin(auth.uid()));

-- BOOKINGS Policies
drop policy if exists "bookings: own read" on public.bookings;
create policy "bookings: own read" on public.bookings for select using (auth.uid() = user_id);

drop policy if exists "bookings: insert own" on public.bookings;
create policy "bookings: insert own" on public.bookings for insert with check (auth.uid() = user_id);

drop policy if exists "bookings: guest insert" on public.bookings;
create policy "bookings: guest insert" on public.bookings for insert with check (user_id is null);

drop policy if exists "bookings: admin read all" on public.bookings;
create policy "bookings: admin read all" on public.bookings for select using (public.is_admin(auth.uid()));

drop policy if exists "bookings: admin update" on public.bookings;
create policy "bookings: admin update" on public.bookings for update using (public.is_admin(auth.uid()));

-- REVIEWS Policies
drop policy if exists "reviews: public read" on public.reviews;
create policy "reviews: public read" on public.reviews for select using (true);

drop policy if exists "reviews: insert own" on public.reviews;
create policy "reviews: insert own" on public.reviews for insert with check (auth.uid() = user_id);

drop policy if exists "reviews: update own" on public.reviews;
create policy "reviews: update own" on public.reviews for update using (auth.uid() = user_id);

drop policy if exists "reviews: delete own" on public.reviews;
create policy "reviews: delete own" on public.reviews for delete using (auth.uid() = user_id);

-- CLOSED DATES Policies
drop policy if exists "closed_dates: public read" on public.closed_dates;
create policy "closed_dates: public read" on public.closed_dates for select using (true);

drop policy if exists "closed_dates: admin insert" on public.closed_dates;
create policy "closed_dates: admin insert" on public.closed_dates for insert with check (public.is_admin(auth.uid()));

drop policy if exists "closed_dates: admin update" on public.closed_dates;
create policy "closed_dates: admin update" on public.closed_dates for update using (public.is_admin(auth.uid()));

drop policy if exists "closed_dates: admin delete" on public.closed_dates;
create policy "closed_dates: admin delete" on public.closed_dates for delete using (public.is_admin(auth.uid()));

-- ── 7. INDEXES & VIEWS ─────────────────────────────────────────
create index idx_bookings_user_id    on public.bookings(user_id);
create index idx_bookings_status     on public.bookings(status);
create index idx_bookings_created_at on public.bookings(created_at desc);

create index idx_reviews_created_at on public.reviews(created_at desc);
create index idx_reviews_user_id    on public.reviews(user_id);
create index idx_reviews_rating     on public.reviews(rating);

create index idx_closed_dates_date  on public.closed_dates(closed_date);

create or replace view public.booking_summary with (security_invoker = true) as
select
  b.*,
  p.full_name as profile_name
from public.bookings b
left join public.profiles p on p.id = b.user_id;

-- ── COMPLETE ───────────────────────────────────────────────────
