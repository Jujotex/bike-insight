-- Ajout des seuils personnalisables sur notification_settings
alter table public.notification_settings
  add column if not exists warn_threshold int not null default 80,
  add column if not exists bad_threshold  int not null default 100;

-- Contraintes de cohérence
alter table public.notification_settings
  add constraint warn_threshold_range check (warn_threshold between 50 and 95),
  add constraint bad_threshold_range  check (bad_threshold  between 80 and 120);
