-- ============================================================
-- Bike Insight — Réglage : commentaire d'usure sur Strava
-- Migration : 20260705000002_strava_wear_comment
--
-- Quand activé, une phrase d'alerte d'usure critique est ajoutée à la
-- description de la sortie Strava lors de la synchro. Désactivé par défaut
-- (écriture publique sur le compte Strava de l'utilisateur → opt-in).
-- ============================================================

alter table public.notification_settings
  add column if not exists strava_wear_comment boolean not null default false;

comment on column public.notification_settings.strava_wear_comment is
  'Si vrai : ajoute une alerte d''usure critique dans la description des sorties Strava (opt-in, nécessite le scope activity:write)';
