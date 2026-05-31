-- Table notifications in-app
create table if not exists public.notifications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  component_id  uuid references public.components(id) on delete set null,
  bike_id       uuid references public.bikes(id) on delete cascade,
  component_name text not null,
  bike_name      text not null,
  type           text not null check (type in ('warn', 'bad')),
  read           boolean not null default false,
  created_at     timestamptz not null default now()
);

-- Index pour les requêtes non lues par user
create index if not exists notifications_user_unread
  on public.notifications(user_id, read, created_at desc);

-- RLS
alter table public.notifications enable row level security;

create policy "Users see own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

create policy "Service can insert notifications"
  on public.notifications for insert
  with check (auth.uid() = user_id);
