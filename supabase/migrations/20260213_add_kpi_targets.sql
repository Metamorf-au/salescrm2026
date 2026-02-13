-- ============================================================
-- KPI TARGETS TABLE — Per-rep weekly KPI targets
-- Allows admins to set individual targets for each rep.
-- Default values are applied automatically for new users.
-- ============================================================

-- 1. Create the table
create table public.kpi_targets (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade unique,
  weekly_calls integer not null default 100,
  weekly_meetings integer not null default 10,
  weekly_contacts integer not null default 5,
  weekly_quotes integer not null default 10,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_kpi_targets_user on public.kpi_targets(user_id);

-- 2. Enable RLS
alter table public.kpi_targets enable row level security;

-- 3. RLS Policies
-- Everyone can read KPI targets (needed for dashboard comparisons)
create policy "kpi_targets_select" on public.kpi_targets
  for select using (true);

-- Only admins can insert KPI targets
create policy "kpi_targets_insert" on public.kpi_targets
  for insert with check (public.current_user_role() = 'admin');

-- Only admins can update KPI targets
create policy "kpi_targets_update" on public.kpi_targets
  for update using (public.current_user_role() = 'admin');

-- 4. Auto-update timestamp trigger
create trigger set_kpi_targets_updated_at
  before update on public.kpi_targets
  for each row execute function public.set_updated_at();

-- 5. Auto-create KPI targets when a new profile is created
create or replace function public.handle_new_kpi_targets()
returns trigger as $$
begin
  insert into public.kpi_targets (user_id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_profile_created_kpi_targets
  after insert on public.profiles
  for each row execute function public.handle_new_kpi_targets();

-- 6. Seed KPI targets for all existing users who don't have them yet
insert into public.kpi_targets (user_id)
select id from public.profiles
where id not in (select user_id from public.kpi_targets);
