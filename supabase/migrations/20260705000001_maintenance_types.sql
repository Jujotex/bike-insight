-- ============================================================
-- Bike Insight — Types d'entretien personnalisables (par vélo)
-- Migration : 20260705000001_maintenance_types
--
-- Avant : les 7 entretiens étaient codés en dur (src/lib/maintenance-catalog.ts).
-- Après : chaque vélo possède sa propre liste, modifiable par l'utilisateur.
-- Le lien avec l'historique (maintenance_logs.maintenance_type) se fait via `slug`.
-- ============================================================

-- ── Table ─────────────────────────────────────────────────────
create table maintenance_types (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references profiles(id) on delete cascade,
  bike_id         uuid not null references bikes(id) on delete cascade,
  slug            text not null,                 -- clé stable utilisée dans maintenance_logs.maintenance_type
  label           text not null,
  sub             text,                          -- aide en langage simple (optionnel)
  interval_km     integer check (interval_km is null or interval_km > 0),
  interval_months integer check (interval_months is null or interval_months > 0),
  default_cost    numeric(10,2) check (default_cost is null or default_cost >= 0),
  sort_order      integer not null default 100,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (bike_id, slug)
);

comment on table maintenance_types is 'Types d''entretien personnalisables, propres à chaque vélo';

create index idx_maintenance_types_bike_id on maintenance_types(bike_id);
create index idx_maintenance_types_user_id on maintenance_types(user_id);

-- ── RLS ───────────────────────────────────────────────────────
alter table maintenance_types enable row level security;

create policy "maintenance_types: lecture own" on maintenance_types
  for select using (auth.uid() = user_id);

create policy "maintenance_types: insert own" on maintenance_types
  for insert with check (auth.uid() = user_id);

create policy "maintenance_types: update own" on maintenance_types
  for update using (auth.uid() = user_id);

create policy "maintenance_types: delete own" on maintenance_types
  for delete using (auth.uid() = user_id);

-- ── updated_at ────────────────────────────────────────────────
create trigger trg_maintenance_types_updated_at
  before update on maintenance_types
  for each row execute function set_updated_at();

-- ============================================================
-- Liste des entretiens par défaut (miroir de l'ancien catalogue)
-- ============================================================
create or replace function default_maintenance_types()
returns table(
  slug text, label text, sub text,
  interval_km integer, interval_months integer,
  default_cost numeric, sort_order integer
)
language sql
immutable
as $$
  values
    ('lubrification-chaine',   'Lubrifier la chaîne',                     'Plus souvent sous la pluie ou en hiver',                        250::integer,  1::integer,  null::numeric, 10),
    ('nettoyage-transmission', 'Nettoyer et dégraisser la transmission',  'Chaîne, cassette, plateaux — prolonge leur durée de vie',       1000::integer, 3::integer,  null::numeric, 20),
    ('purge-freins',           'Purger les freins hydrauliques',          'Levier spongieux = purge en retard',                            null::integer, 12::integer, 30::numeric,   30),
    ('preventif-tubeless',     'Renouveler le préventif tubeless',        'Si tu roules en tubeless — le liquide sèche avec le temps',     null::integer, 4::integer,  null::numeric, 40),
    ('controle-serrages',      'Contrôler les serrages',                  'Potence, cintre, tige de selle, roues — au couple',             null::integer, 6::integer,  null::numeric, 50),
    ('entretien-suspension',   'Entretien fourche / suspension',          'Joints et bain d''huile — évite les réparations coûteuses',     1500::integer, 12::integer, 80::numeric,   60),
    ('revision-complete',      'Révision complète',                       'Chez ton vélociste — roulements, jeu de direction, réglages',   5000::integer, 12::integer, 80::numeric,   70);
$$;

-- ============================================================
-- Seed automatique à la création d'un vélo (manuel ou Strava)
-- security definer : insère malgré la RLS, avec le bon user_id/bike_id
-- ============================================================
create or replace function seed_bike_maintenance_types()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into maintenance_types
    (user_id, bike_id, slug, label, sub, interval_km, interval_months, default_cost, sort_order)
  select new.user_id, new.id, d.slug, d.label, d.sub, d.interval_km, d.interval_months, d.default_cost, d.sort_order
  from default_maintenance_types() d
  on conflict (bike_id, slug) do nothing;
  return new;
end;
$$;

create trigger trg_seed_bike_maintenance_types
  after insert on bikes
  for each row execute function seed_bike_maintenance_types();

-- ============================================================
-- Backfill : équiper les vélos déjà existants
-- ============================================================
insert into maintenance_types
  (user_id, bike_id, slug, label, sub, interval_km, interval_months, default_cost, sort_order)
select b.user_id, b.id, d.slug, d.label, d.sub, d.interval_km, d.interval_months, d.default_cost, d.sort_order
from bikes b
cross join default_maintenance_types() d
on conflict (bike_id, slug) do nothing;
