-- Ajout de last_sync_at sur profiles pour l'import incrémental Strava
alter table public.profiles
  add column if not exists last_sync_at timestamptz;
