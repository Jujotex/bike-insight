-- Préférences de notifications par utilisateur
create table if not exists public.notification_settings (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  notify_warn  boolean not null default true,   -- alerte usure > 80%
  notify_bad   boolean not null default true,   -- alerte usure > 100%
  updated_at   timestamptz not null default now()
);

alter table public.notification_settings enable row level security;

create policy "Users manage own notification settings"
  on public.notification_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Trigger updated_at
create or replace function update_notification_settings_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger notification_settings_updated_at
  before update on public.notification_settings
  for each row execute function update_notification_settings_updated_at();
