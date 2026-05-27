-- Ajoute la policy UPDATE manquante sur activities
-- Sans cette policy, le upsert (onConflict + update) échoue avec RLS "USING expression"

create policy "activities: update own" on activities
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
