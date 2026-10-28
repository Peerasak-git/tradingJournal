-- =========================================================================
-- TRADING JOURNAL - SUPABASE DATABASE SCHEMA
-- Run this script in your Supabase SQL Editor (SQL Editor -> New Query -> Run)
-- =========================================================================

-- 1. TRADES TABLE
create table if not exists public.trades (
  id text primary key,
  account_id text,
  instrument text,
  direction text,
  status text,
  pnl numeric,
  entry_date text,
  data jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. ACCOUNTS TABLE
create table if not exists public.accounts (
  id text primary key,
  name text,
  balance numeric,
  currency text,
  data jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. JOURNALS TABLE
create table if not exists public.journals (
  id text primary key,
  date text,
  data jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. FINANCES TABLE
create table if not exists public.finances (
  id text primary key,
  date text,
  type text,
  amount numeric,
  account_id text,
  data jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. REVIEWS TABLE
create table if not exists public.reviews (
  id text primary key,
  date text,
  rating numeric,
  data jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 6. APP STATE (For Security PIN, User Profile, Global Settings)
create table if not exists public.app_state (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

-- -------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Allows your web app (using anon key) to read and write your data seamlessly
-- -------------------------------------------------------------------------

alter table public.trades enable row level security;
alter table public.accounts enable row level security;
alter table public.journals enable row level security;
alter table public.finances enable row level security;
alter table public.reviews enable row level security;
alter table public.app_state enable row level security;

-- Drop existing policies if re-running
drop policy if exists "Allow anon all on trades" on public.trades;
drop policy if exists "Allow anon all on accounts" on public.accounts;
drop policy if exists "Allow anon all on journals" on public.journals;
drop policy if exists "Allow anon all on finances" on public.finances;
drop policy if exists "Allow anon all on reviews" on public.reviews;
drop policy if exists "Allow anon all on app_state" on public.app_state;

-- Create full access policies
create policy "Allow anon all on trades" on public.trades for all using (true) with check (true);
create policy "Allow anon all on accounts" on public.accounts for all using (true) with check (true);
create policy "Allow anon all on journals" on public.journals for all using (true) with check (true);
create policy "Allow anon all on finances" on public.finances for all using (true) with check (true);
create policy "Allow anon all on reviews" on public.reviews for all using (true) with check (true);
create policy "Allow anon all on app_state" on public.app_state for all using (true) with check (true);

-- -------------------------------------------------------------------------
-- REALTIME REPLICATION (Optional: enable live sync across tabs and devices)
-- -------------------------------------------------------------------------
do $$
begin
  alter publication supabase_realtime add table public.trades;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.accounts;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.journals;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.finances;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.reviews;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.app_state;
exception when others then null;
end $$;

-- -------------------------------------------------------------------------
-- 7. PASSWORD RESET & EMAIL CONFIRMATION BYPASS FUNCTION
-- Allows verifying member display name and setting new password directly
-- -------------------------------------------------------------------------
create or replace function public.reset_user_password_by_member_info(
  user_email text,
  user_display_name text,
  new_password text
)
returns boolean
language plpgsql
security definer
as $$
declare
  target_user_id uuid;
  current_meta jsonb;
begin
  select id, raw_user_meta_data into target_user_id, current_meta
  from auth.users
  where lower(email) = lower(trim(user_email));

  if target_user_id is null then
    return false;
  end if;

  -- Update password and auto-confirm email in auth.users
  update auth.users
  set encrypted_password = crypt(new_password, gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
  where id = target_user_id;

  return true;
end;
$$;
