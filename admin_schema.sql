-- ============================================================
-- DeepDive — Admin Panel Schema Migration
-- Run this in the Supabase SQL Editor AFTER supabase_schema.sql
-- (Dashboard → SQL Editor → New Query → paste → Run)
-- ============================================================

-- ── 1. Extend PROFILES: store email + admin flag ────────────
alter table public.profiles add column if not exists email    text;
alter table public.profiles add column if not exists is_admin boolean not null default false;

-- Re-create the "new user" trigger function so every new signup:
--   • stores their email on the profile row
--   • is automatically flagged as admin ONLY if they sign up with
--     the designated admin email address (configured in Supabase)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, email, is_admin)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    -- !! Replace 'your-admin@example.com' with the value of ADMIN_EMAIL from your .env
    -- !! Do NOT commit this file after substituting the real email address.
    (lower(new.email) = 'your-admin@example.com')
  );
  return new;
end;
$$;
-- (the trigger on_auth_user_created created in supabase_schema.sql
--  already points at this function, so it does not need to be re-created)

-- Backfill email / admin flag for any profiles that already exist.
-- NOTE: Replace 'your-admin@example.com' below with the actual admin
-- email address before running this migration. Do NOT commit real
-- credentials to version control.
update public.profiles p
set email    = u.email,
    is_admin = (lower(u.email) = 'your-admin@example.com')
from auth.users u
where p.id = u.id
  and (p.email is distinct from u.email or p.is_admin is distinct from (lower(u.email) = 'your-admin@example.com'));

-- ── 2. Helper function: is a given user an admin? ────────────
-- SECURITY DEFINER lets this bypass RLS internally, which avoids
-- infinite-recursion errors when it's used inside RLS policies
-- that themselves protect the profiles table.
create or replace function public.is_admin(uid uuid)
returns boolean
language sql security definer stable as $$
  select coalesce((select is_admin from public.profiles where id = uid), false);
$$;

-- ── 3. CLOSED DATES table ────────────────────────────────────
-- Admin-controlled booking blackout dates. Every Wednesday is
-- ALSO permanently closed, but that rule is enforced in the
-- frontend code (index.html) since it never changes and doesn't
-- need a database row for every Wednesday until the end of time.
create table if not exists public.closed_dates (
  id          uuid primary key default uuid_generate_v4(),
  closed_date date not null unique,
  reason      text,
  closed_by   uuid references auth.users(id),
  created_at  timestamptz default now()
);
create index if not exists idx_closed_dates_date on public.closed_dates(closed_date);

alter table public.closed_dates enable row level security;

-- Everyone (including guests) needs to be able to read closed
-- dates so the booking calendar can grey them out.
drop policy if exists "closed_dates: public read" on public.closed_dates;
create policy "closed_dates: public read"
  on public.closed_dates for select
  using ( true );

-- Only admins can open/close dates.
drop policy if exists "closed_dates: admin insert" on public.closed_dates;
create policy "closed_dates: admin insert"
  on public.closed_dates for insert
  with check ( public.is_admin(auth.uid()) );

drop policy if exists "closed_dates: admin update" on public.closed_dates;
create policy "closed_dates: admin update"
  on public.closed_dates for update
  using ( public.is_admin(auth.uid()) );

drop policy if exists "closed_dates: admin delete" on public.closed_dates;
create policy "closed_dates: admin delete"
  on public.closed_dates for delete
  using ( public.is_admin(auth.uid()) );

-- ── 4. Let the admin read/manage every booking & profile ─────
drop policy if exists "bookings: admin read all" on public.bookings;
create policy "bookings: admin read all"
  on public.bookings for select
  using ( public.is_admin(auth.uid()) );

drop policy if exists "bookings: admin update" on public.bookings;
create policy "bookings: admin update"
  on public.bookings for update
  using ( public.is_admin(auth.uid()) );

drop policy if exists "profiles: admin read all" on public.profiles;
create policy "profiles: admin read all"
  on public.profiles for select
  using ( public.is_admin(auth.uid()) );

-- ── DONE ──────────────────────────────────────────────────
-- Open admin.html and log in with the admin account you set up.
-- ⚠  SECURITY REMINDER
--    Never commit real email addresses or passwords to this file.
--    Replace the placeholder in the backfill UPDATE above with your
--    actual admin email only when running this migration locally or
--    in a private / secured environment.
--    The trigger function checks against the email stored in
--    auth.users, which is managed entirely inside Supabase Auth.
