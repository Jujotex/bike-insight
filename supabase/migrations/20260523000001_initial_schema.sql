-- ============================================================
-- Bike Insight — Schéma initial
-- Migration : 20260523000001_initial_schema
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

create type component_status as enum ('ok', 'warn', 'bad', 'archived');
create type component_category as enum (
  'transmission',
  'freinage',
  'suspension',
  'roues',
  'cockpit',
  'eclairage',
  'autre'
);

-- ============================================================
-- TABLE : profiles
-- Données utilisateur liées à auth.users
-- ============================================================

create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  strava_access_token   text,
  strava_refresh_token  text,
  strava_token_expires_at bigint,
  strava_athlete_id     bigint unique,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table profiles is 'Données profil utilisateur, 1:1 avec auth.users';

-- ============================================================
-- TABLE : bikes
-- Vélos de l'utilisateur
-- ============================================================

create table bikes (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references profiles(id) on delete cascade,
  name          text not null,
  brand         text,
  model         text,
  year          int,
  strava_gear_id text unique,          -- identifiant Strava ex: "b12345"
  total_km      numeric(10,2) not null default 0,
  purchase_price numeric(10,2),
  purchase_date  date,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table bikes is 'Vélos appartenant à un utilisateur';

-- ============================================================
-- TABLE : components
-- Pièces/composants installés sur un vélo
-- ============================================================

create table components (
  id              uuid primary key default uuid_generate_v4(),
  bike_id         uuid not null references bikes(id) on delete cascade,
  user_id         uuid not null references profiles(id) on delete cascade,
  name            text not null,
  brand           text,
  category        component_category not null default 'autre',
  purchase_price  numeric(10,2),
  installed_at    date,
  installed_km    numeric(10,2) not null default 0,  -- km vélo à l'installation
  km_used         numeric(10,2) not null default 0,  -- km parcourus depuis installation
  km_max          numeric(10,2),                      -- durée de vie estimée en km
  status          component_status not null default 'ok',
  notes           text,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint km_max_positive check (km_max is null or km_max > 0),
  constraint km_used_non_negative check (km_used >= 0)
);

comment on table components is 'Composants installés sur un vélo, avec suivi kilométrique';

-- ============================================================
-- TABLE : activities
-- Sorties Strava importées
-- ============================================================

create table activities (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references profiles(id) on delete cascade,
  bike_id         uuid references bikes(id) on delete set null,
  strava_id       bigint unique not null,
  name            text,
  distance_km     numeric(10,3) not null default 0,
  moving_time_s   int,                    -- durée en secondes
  elevation_m     numeric(8,1),
  started_at      timestamptz not null,
  created_at      timestamptz not null default now()
);

comment on table activities is 'Activités Strava importées (lecture seule, source de vérité km)';

-- ============================================================
-- TABLE : maintenance_logs
-- Historique des remplacements de composants
-- ============================================================

create table maintenance_logs (
  id              uuid primary key default uuid_generate_v4(),
  component_id    uuid not null references components(id) on delete cascade,
  user_id         uuid not null references profiles(id) on delete cascade,
  action          text not null,          -- ex: "Remplacement", "Réglage", "Nettoyage"
  km_at_action    numeric(10,2),          -- km vélo au moment de l'action
  cost            numeric(10,2),
  notes           text,
  performed_at    date not null default current_date,
  created_at      timestamptz not null default now()
);

comment on table maintenance_logs is 'Historique des opérations de maintenance par composant';

-- ============================================================
-- INDEX
-- ============================================================

create index idx_bikes_user_id on bikes(user_id);
create index idx_components_bike_id on components(bike_id);
create index idx_components_user_id on components(user_id);
create index idx_components_status on components(status);
create index idx_activities_user_id on activities(user_id);
create index idx_activities_bike_id on activities(bike_id);
create index idx_activities_started_at on activities(started_at desc);
create index idx_maintenance_logs_component_id on maintenance_logs(component_id);

-- ============================================================
-- FUNCTION : updated_at trigger
-- ============================================================

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

create trigger trg_bikes_updated_at
  before update on bikes
  for each row execute function set_updated_at();

create trigger trg_components_updated_at
  before update on components
  for each row execute function set_updated_at();

-- ============================================================
-- FUNCTION : component_status auto-update
-- Recalcule le statut ok/warn/bad à chaque update de km_used
-- ============================================================

create or replace function update_component_status()
returns trigger as $$
begin
  if new.km_max is not null and new.km_max > 0 then
    case
      when (new.km_used / new.km_max) >= 0.9 then new.status = 'bad';
      when (new.km_used / new.km_max) >= 0.7 then new.status = 'warn';
      else new.status = 'ok';
    end case;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_component_status
  before insert or update of km_used, km_max on components
  for each row execute function update_component_status();

-- ============================================================
-- FUNCTION : profile auto-create on signup
-- ============================================================

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
