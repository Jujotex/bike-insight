-- Sauvegarde du template de groupe sélectionné pendant l'onboarding
-- Permet la validation de compatibilité et les suggestions personnalisées

alter table bikes
  add column if not exists groupset_template_id text;

comment on column bikes.groupset_template_id is
  'ID du template BikeInsight sélectionné lors de la configuration (ex: shimano-105-11v)';
