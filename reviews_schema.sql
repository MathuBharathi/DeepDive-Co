-- ============================================================
-- DeepDive — Reviews Schema (Separate File)
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- Run AFTER supabase_schema.sql has been executed.
-- ============================================================

-- Enable UUID extension (safe to call again if already enabled)
create extension if not exists "uuid-ossp";

-- ── REVIEWS TABLE ─────────────────────────────────────────
create table if not exists public.reviews (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  user_name    text not null,
  rating       int not null check (rating >= 1 and rating <= 5),
  review_text  text not null check (char_length(review_text) >= 10),
  dive_type    text not null,
  created_at   timestamptz default now()
);

-- ── ROW LEVEL SECURITY ────────────────────────────────────
alter table public.reviews enable row level security;

-- Anyone (including anonymous / public) can read all reviews
create policy "reviews: public read"
  on public.reviews for select
  using (true);

-- Authenticated users can insert their own reviews
create policy "reviews: insert own"
  on public.reviews for insert
  with check (auth.uid() = user_id);

-- Users can update their own reviews
create policy "reviews: update own"
  on public.reviews for update
  using (auth.uid() = user_id);

-- Users can delete their own reviews
create policy "reviews: delete own"
  on public.reviews for delete
  using (auth.uid() = user_id);

-- ── INDEXES ───────────────────────────────────────────────
create index if not exists idx_reviews_created_at on public.reviews(created_at desc);
create index if not exists idx_reviews_user_id    on public.reviews(user_id);
create index if not exists idx_reviews_rating     on public.reviews(rating);

-- ── DONE ──────────────────────────────────────────────────
-- After running this SQL:
--   1. Verify the 'reviews' table appears in Table Editor
--   2. Check that 4 RLS policies are active (public read, insert own, update own, delete own)
--   3. Test by inserting a review from the website
