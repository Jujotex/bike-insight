-- ============================================================
-- Bike Insight — Suppression de compte par l'utilisateur
-- Migration : 20260812000002_delete_own_account
-- ============================================================
--
-- Contexte : le bouton « Supprimer mon compte » ouvrait un simple `mailto`.
-- Aucune donnée n'était effacée. Deux exigences non satisfaites :
--
--   • Apple — la suppression de compte doit pouvoir être déclenchée DANS
--     l'application, pas par un email au support (exigence ferme depuis 2022,
--     motif de rejet direct pour toute app qui crée des comptes).
--   • API Policy Strava §2.5 / §7.4 — suppression de toutes les données de
--     l'utilisateur sur demande, sous 30 jours, avec confirmation écrite.
--
-- Choix d'implémentation : fonction `security definer` plutôt qu'une route
-- serveur utilisant la clé de service. Supprimer un utilisateur dans
-- `auth.users` demande des droits élevés ; passer par une fonction cadrée
-- évite d'introduire `SUPABASE_SERVICE_ROLE_KEY` dans l'application — donc
-- pas de secret « tout-puissant » supplémentaire à protéger, ni de risque de
-- fuite via une variable d'environnement.
--
-- Portée de la suppression : tout part en cascade depuis `auth.users`.
--   auth.users
--     └─ profiles                       (on delete cascade)
--          ├─ bikes                     (on delete cascade)
--          │    ├─ components           (on delete cascade)
--          │    └─ maintenance_types    (on delete cascade)
--          ├─ activities                (on delete cascade)  ← données Strava
--          └─ maintenance_logs          (on delete cascade)
--     ├─ notifications                  (on delete cascade)
--     └─ notification_settings          (on delete cascade)
-- Vérifié migration par migration le 2026-08-12 : aucune table orpheline.
-- ============================================================

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
-- search_path vide + identifiants pleinement qualifiés : une fonction
-- `security definer` s'exécute avec les droits de son propriétaire, il ne faut
-- donc pas qu'un search_path manipulable puisse détourner un appel.
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  -- Un appel non authentifié ne doit jamais supprimer quoi que ce soit.
  if v_user_id is null then
    raise exception 'delete_own_account: appel non authentifié'
      using errcode = '28000';
  end if;

  -- L'utilisateur ne peut supprimer que lui-même : l'identifiant vient
  -- d'auth.uid(), jamais d'un paramètre. Pas de surface d'abus.
  delete from auth.users where id = v_user_id;
end;
$$;

comment on function public.delete_own_account() is
  'Supprime le compte de l''appelant et, par cascade, toutes ses données (dont les sorties importées de Strava). Exigence Apple (suppression in-app) et API Policy Strava §2.5/§7.4.';

-- Par défaut PostgreSQL accorde EXECUTE à PUBLIC sur les fonctions : on retire
-- puis on rouvre au seul rôle authentifié.
revoke all on function public.delete_own_account() from public;
revoke all on function public.delete_own_account() from anon;
grant execute on function public.delete_own_account() to authenticated;
