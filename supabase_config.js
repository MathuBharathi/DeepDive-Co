// ============================================================
// DeepDive — Supabase Configuration
//
// Credentials are loaded at runtime from env.js (gitignored).
// This file contains NO hardcoded keys, URLs, or passwords.
//
// Setup after cloning:
//   1. Copy env.example.js → env.js
//   2. Fill in your real values in env.js
//   3. Open any HTML page in a browser — done.
//
// env.js sets window.__env before this script runs because
// every HTML page loads env.js first, then supabase_config.js.
// ============================================================

// ── Read credentials from env.js (window.__env) ─────────────
const _env        = window.__env || {};
const SUPABASE_URL  = _env.SUPABASE_URL  || '';
const SUPABASE_ANON = _env.SUPABASE_ANON || '';

if (!SUPABASE_URL || !SUPABASE_ANON) {
  console.error(
    '[DeepDive] Missing Supabase credentials.\n' +
    'Copy env.example.js → env.js and fill in your project URL and Anon key.\n' +
    'Both values are in: Supabase Dashboard → Settings → API'
  );
}

// ── Initialise the Supabase client ───────────────────────────
let _supabase;
try {
  _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
} catch(e) {
  console.warn('Supabase init failed — check env.js for correct SUPABASE_URL and SUPABASE_ANON.', e);
  // Stub so the rest of the page does not crash — a generic chainable mock
  // that supports .select().eq().order() etc in any combination and
  // resolves to an empty/error result when awaited.
  const _stubResult = { data: null, error: { message: 'Supabase not configured' } };
  function _stubChain() {
    return new Proxy(function(){}, {
      get(_t, prop) {
        if (prop === 'then') return (resolve) => resolve(_stubResult);
        return () => _stubChain();
      },
      apply() { return _stubChain(); }
    });
  }
  _supabase = {
    auth: {
      getSession:           async () => ({ data: { session: null } }),
      signInWithPassword:   async () => ({ data: null, error: { message: 'Supabase not configured' } }),
      signUp:               async () => ({ data: null, error: { message: 'Supabase not configured' } }),
      signOut:              async () => {},
      resetPasswordForEmail:async () => ({ error: null }),
      signInWithOAuth:      async () => ({ error: null }),
      onAuthStateChange:    ()      => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: () => _stubChain(),
  };
}

// ── Auth helpers ─────────────────────────────────────────────
async function getSession() {
  const { data: { session } } = await _supabase.auth.getSession();
  return session;
}

async function getUser() {
  const session = await getSession();
  return session?.user ?? null;
}

async function signOut() {
  await _supabase.auth.signOut();
  window.location.href = 'index.html';
}

// ── Booking helpers ──────────────────────────────────────────
async function saveBooking(payload) {
  const { data, error } = await _supabase.from('bookings').insert([payload]).select();
  return { data, error };
}

async function getUserBookings(userId) {
  const { data, error } = await _supabase
    .from('bookings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return { data, error };
}

// ── Review helpers ───────────────────────────────────────────
async function saveReview(payload) {
  const { data, error } = await _supabase.from('reviews').insert([payload]).select();
  return { data, error };
}

async function getAllReviews() {
  const { data, error } = await _supabase
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false });
  return { data: data || [], error };
}

// ── Admin helpers ─────────────────────────────────────────────
// Checks the `is_admin` flag on the current user's profile row.
// The admin account is identified server-side by the Supabase
// handle_new_user trigger (see admin_schema.sql).
async function isCurrentUserAdmin() {
  const user = await getUser();
  if (!user) return false;
  const { data, error } = await _supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();
  if (error || !data) return false;
  return !!data.is_admin;
}

async function getAllBookingsAdmin() {
  const { data, error } = await _supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false });
  return { data: data || [], error };
}

async function getAllProfilesAdmin() {
  const { data, error } = await _supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  return { data: data || [], error };
}

async function updateBookingStatusAdmin(bookingId, status) {
  const { data, error } = await _supabase
    .from('bookings')
    .update({ status })
    .eq('id', bookingId)
    .select();
  return { data, error };
}

// ── Closed dates (admin-controlled booking blackout) ──────────
async function getClosedDates() {
  const { data, error } = await _supabase
    .from('closed_dates')
    .select('*')
    .order('closed_date', { ascending: true });
  return { data: data || [], error };
}

async function addClosedDate(dateStr, reason) {
  const { data, error } = await _supabase
    .from('closed_dates')
    .upsert([{ closed_date: dateStr, reason: reason || null }], { onConflict: 'closed_date' })
    .select();
  return { data, error };
}

async function removeClosedDate(dateStr) {
  const { error } = await _supabase
    .from('closed_dates')
    .delete()
    .eq('closed_date', dateStr);
  return { error };
}

// Every Wednesday is a permanent holiday — no diving, ever.
function isWednesday(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.getDay() === 3;
}

// ── Nav: update auth links in navbar ─────────────────────────
async function updateNavAuth() {
  const user = await getUser();
  const authLink    = document.getElementById('nav-auth-link');
  const profileLink = document.getElementById('nav-profile-link');
  if (!authLink) return;
  if (user) {
    authLink.textContent = 'Sign Out';
    authLink.href        = '#';
    authLink.onclick     = (e) => { e.preventDefault(); signOut(); };
    if (profileLink) profileLink.style.display = 'inline-block';
  } else {
    authLink.textContent = 'Login';
    authLink.href        = 'login_signup.html';
    authLink.onclick     = null;
    if (profileLink) profileLink.style.display = 'none';
  }
}
