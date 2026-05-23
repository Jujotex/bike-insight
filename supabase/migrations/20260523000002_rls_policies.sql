-- ============================================================
-- Bike Insight — Row Level Security
-- Migration : 20260523000002_rls_policies
-- ============================================================

-- Activation RLS sur toutes les tables

alter table profiles enable row level security;
alter table bikes enable row level security;
alter table components enable row level security;
alter table activities enable row level security;
alter table maintenance_logs enable row level security;

-- ============================================================
-- PROFILES
-- ============================================================

create policy "profiles: lecture own" on profiles
  for select using (auth.uid() = id);

create policy "profiles: update own" on profiles
  for update using (auth.uid() = id);

-- Insert géré par le trigger handle_new_user (security definer)

-- ============================================================
-- BIKES
-- ============================================================

create policy "bikes: lecture own" on bikes
  for select using (auth.uid() = user_id);

create policy "bikes: insert own" on bikes
  for insert with check (auth.uid() = user_id);

create policy "bikes: update own" on bikes
  for update using (auth.uid() = user_id);

create policy "bikes: delete own" on bikes
  for delete using (auth.uid() = user_id);

-- ============================================================
-- COMPONENTS
-- ============================================================

create policy "components: lecture own" on components
  for select using (auth.uid() = user_id);

create policy "components: insert own" on components
  for insert with check (auth.uid() = user_id);

create policy "components: update own" on components
  for update using (auth.uid() = user_id);

create policy "components: delete own" on components
  for delete using (auth.uid() = user_id);

-- ============================================================
-- ACTIVITIES
-- ============================================================

create policy "activities: lecture own" on activities
  for select using (auth.uid() = user_id);

create policy "activities: insert own" on activities
  for insert with check (auth.uid() = user_id);

-- Pas d'update/delete sur les activités (source de vérité Strava)

-- ============================================================
-- MAINTENANCE LOGS
-- ============================================================

create policy "maintenance_logs: lecture own" on maintenance_logs
  for select using (auth.uid() = user_id);

create policy "maintenance_logs: insert own" on maintenance_logs
  for insert with check (auth.uid() = user_id);

create policy "maintenance_logs: update own" on maintenance_logs
  for update using (auth.uid() = user_id);

create policy "maintenance_logs: delete own" on maintenance_logs
  for delete using (auth.uid() = user_id);
