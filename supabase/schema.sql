-- ============================================================
-- SALES CRM — DATABASE SCHEMA
-- Run this in the Supabase SQL Editor (supabase.com > SQL Editor)
-- ============================================================

-- ============================================================
-- 1. PROFILES TABLE (extends Supabase auth.users)
-- ============================================================
-- Supabase auth handles login/passwords. This table stores
-- our app-specific user data linked to each auth account.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  role text not null check (role in ('rep', 'manager', 'admin')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'rep')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ============================================================
-- 2. COMPANIES TABLE
-- ============================================================

create table public.companies (
  id bigint generated always as identity primary key,
  hubspot_id text unique,
  name text not null,
  domain text,
  city text,
  state text,
  industry text,
  owner_id uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_companies_owner on public.companies(owner_id);
create index idx_companies_name on public.companies(name);


-- ============================================================
-- 3. CONTACTS TABLE
-- ============================================================

create table public.contacts (
  id bigint generated always as identity primary key,
  hubspot_id text unique,
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  mobile text,
  job_title text,
  industry text,
  company_id bigint references public.companies(id),
  owner_id uuid references public.profiles(id),
  marketing_emails_opened integer default 0,
  -- Address fields (structured for DataTools integration)
  address_line1 text,
  address_line2 text,
  suburb text,
  state text,
  postcode text,
  country text default 'Australia',
  status text not null default 'active' check (status in ('active', 'stale', 'new', 'inactive')),
  last_contact_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_contacts_owner on public.contacts(owner_id);
create index idx_contacts_company on public.contacts(company_id);
create index idx_contacts_name on public.contacts(last_name, first_name);
create index idx_contacts_email on public.contacts(email);


-- ============================================================
-- 4. DEALS TABLE
-- ============================================================

create table public.deals (
  id bigint generated always as identity primary key,
  title text not null,
  contact_id bigint references public.contacts(id),
  company_id bigint references public.companies(id),
  stage text not null default 'discovery' check (stage in ('discovery', 'quote_request', 'quote_sent', 'won', 'lost', 'closed')),
  value numeric(12,2) not null default 0,
  next_action text,
  next_date date,
  owner_id uuid references public.profiles(id),
  quote_requested_at timestamptz,
  quote_sent_at timestamptz,
  won_at timestamptz,
  lost_at timestamptz,
  lost_reason text check (lost_reason in ('price', 'incumbent', 'not_yet', 'other')),
  closed_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_deals_owner on public.deals(owner_id);
create index idx_deals_stage on public.deals(stage);
create index idx_deals_contact on public.deals(contact_id);
create index idx_deals_company on public.deals(company_id);


-- ============================================================
-- 5. NOTES TABLE
-- ============================================================

create table public.notes (
  id bigint generated always as identity primary key,
  contact_id bigint not null references public.contacts(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  type text not null default 'general' check (type in ('general', 'follow_up', 'meeting', 'pricing', 'internal')),
  text text not null,
  reminder_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_notes_contact on public.notes(contact_id);
create index idx_notes_author on public.notes(author_id);
create index idx_notes_reminder on public.notes(reminder_at) where reminder_at is not null;


-- ============================================================
-- 6. CALLS TABLE
-- ============================================================

create table public.calls (
  id bigint generated always as identity primary key,
  contact_id bigint not null references public.contacts(id) on delete cascade,
  caller_id uuid not null references public.profiles(id),
  outcome text not null check (outcome in ('connected', 'voicemail', 'no_answer', 'meeting')),
  summary text,
  called_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index idx_calls_contact on public.calls(contact_id);
create index idx_calls_caller on public.calls(caller_id);
create index idx_calls_date on public.calls(called_at);


-- ============================================================
-- 7. ACTIVITY LOG TABLE
-- ============================================================

create table public.activity_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id),
  activity_type text not null check (activity_type in (
    'call', 'new_contact', 'new_deal', 'deal_won', 'deal_lost',
    'deal_voided', 'quote_sent', 'quote_requested', 'note_added',
    'contact_updated', 'deal_updated'
  )),
  contact_name text,
  company_name text,
  summary text,
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

create index idx_activity_user on public.activity_log(user_id);
create index idx_activity_type on public.activity_log(activity_type);
create index idx_activity_date on public.activity_log(created_at);


-- ============================================================
-- 8. UPDATED_AT TRIGGER
-- ============================================================
-- Automatically sets updated_at on any row change

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger set_companies_updated_at before update on public.companies for each row execute function public.set_updated_at();
create trigger set_contacts_updated_at before update on public.contacts for each row execute function public.set_updated_at();
create trigger set_deals_updated_at before update on public.deals for each row execute function public.set_updated_at();
create trigger set_notes_updated_at before update on public.notes for each row execute function public.set_updated_at();


-- ============================================================
-- 9. ROW LEVEL SECURITY — ENABLE ON ALL TABLES
-- ============================================================

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.contacts enable row level security;
alter table public.deals enable row level security;
alter table public.notes enable row level security;
alter table public.calls enable row level security;
alter table public.activity_log enable row level security;


-- ============================================================
-- 10. HELPER FUNCTION — GET CURRENT USER'S ROLE
-- ============================================================

create or replace function public.current_user_role()
returns text as $$
  select role from public.profiles where id = auth.uid();
$$ language sql security definer stable;


-- ============================================================
-- 11. RLS POLICIES — PROFILES
-- ============================================================

-- Everyone can read all profiles (needed for owner names, dropdowns)
create policy "profiles_select" on public.profiles
  for select using (true);

-- Users can update their own profile
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());

-- Admins can update any profile
create policy "profiles_update_admin" on public.profiles
  for update using (public.current_user_role() = 'admin');

-- Admins can insert profiles (user management)
create policy "profiles_insert_admin" on public.profiles
  for insert with check (public.current_user_role() = 'admin');


-- ============================================================
-- 12. RLS POLICIES — COMPANIES
-- ============================================================

-- Reps see companies they own; managers and admins see all
create policy "companies_select" on public.companies
  for select using (
    owner_id = auth.uid()
    or public.current_user_role() in ('manager', 'admin')
  );

-- Any authenticated user can create companies
create policy "companies_insert" on public.companies
  for insert with check (auth.uid() is not null);

-- Reps update own companies; managers and admins update any
create policy "companies_update" on public.companies
  for update using (
    owner_id = auth.uid()
    or public.current_user_role() in ('manager', 'admin')
  );


-- ============================================================
-- 13. RLS POLICIES — CONTACTS
-- ============================================================

-- Reps see own contacts; managers and admins see all
create policy "contacts_select" on public.contacts
  for select using (
    owner_id = auth.uid()
    or public.current_user_role() in ('manager', 'admin')
  );

-- Any authenticated user can create contacts
create policy "contacts_insert" on public.contacts
  for insert with check (auth.uid() is not null);

-- Reps update own contacts; managers and admins update any
create policy "contacts_update" on public.contacts
  for update using (
    owner_id = auth.uid()
    or public.current_user_role() in ('manager', 'admin')
  );


-- ============================================================
-- 14. RLS POLICIES — DEALS
-- ============================================================

-- Reps see own deals; managers and admins see all
create policy "deals_select" on public.deals
  for select using (
    owner_id = auth.uid()
    or public.current_user_role() in ('manager', 'admin')
  );

-- Any authenticated user can create deals
create policy "deals_insert" on public.deals
  for insert with check (auth.uid() is not null);

-- Reps update own deals; managers and admins update any
create policy "deals_update" on public.deals
  for update using (
    owner_id = auth.uid()
    or public.current_user_role() in ('manager', 'admin')
  );


-- ============================================================
-- 15. RLS POLICIES — NOTES
-- ============================================================

-- Reps see notes on their contacts; managers and admins see all
create policy "notes_select" on public.notes
  for select using (
    author_id = auth.uid()
    or public.current_user_role() in ('manager', 'admin')
    or exists (
      select 1 from public.contacts c
      where c.id = contact_id and c.owner_id = auth.uid()
    )
  );

-- Any authenticated user can create notes
create policy "notes_insert" on public.notes
  for insert with check (auth.uid() is not null);

-- Authors can update their own notes; admins can update any
create policy "notes_update" on public.notes
  for update using (
    author_id = auth.uid()
    or public.current_user_role() = 'admin'
  );

-- Authors can delete their own notes; admins can delete any
create policy "notes_delete" on public.notes
  for delete using (
    author_id = auth.uid()
    or public.current_user_role() = 'admin'
  );


-- ============================================================
-- 16. RLS POLICIES — CALLS
-- ============================================================

-- Reps see calls on their contacts; managers and admins see all
create policy "calls_select" on public.calls
  for select using (
    caller_id = auth.uid()
    or public.current_user_role() in ('manager', 'admin')
    or exists (
      select 1 from public.contacts c
      where c.id = contact_id and c.owner_id = auth.uid()
    )
  );

-- Any authenticated user can create calls
create policy "calls_insert" on public.calls
  for insert with check (auth.uid() is not null);


-- ============================================================
-- 17. RLS POLICIES — ACTIVITY LOG
-- ============================================================

-- Reps see own activity; managers and admins see all
create policy "activity_log_select" on public.activity_log
  for select using (
    user_id = auth.uid()
    or public.current_user_role() in ('manager', 'admin')
  );

-- Any authenticated user can create activity log entries
create policy "activity_log_insert" on public.activity_log
  for insert with check (auth.uid() is not null);
