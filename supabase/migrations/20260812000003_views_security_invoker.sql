-- ============================================================
-- Bike Insight — Fuite de données : vues sans security_invoker
-- Migration : 20260812000003_views_security_invoker
-- ============================================================
--
-- 🔴 FAILLE. Les vues `component_stats` et `bike_stats` ont été créées sans
-- l'option `security_invoker`. En PostgreSQL, une vue s'exécute par défaut avec
-- les droits de son **propriétaire** — ici `postgres`, qui possède le BYPASSRLS.
-- La RLS des tables sous-jacentes ne s'applique donc pas quand on lit la vue.
--
-- Conséquence concrète : n'importe quel utilisateur authentifié, avec la clé anon
-- publique (présente dans le bundle client), pouvait lire les vélos, les
-- composants, les coûts et les kilomètres de **tous** les autres utilisateurs :
--
--   supabase.from('bike_stats').select('*')      -- sans filtre user_id
--
-- Le cloisonnement ne reposait que sur les `.eq('user_id', …)` écrits dans le code
-- applicatif — c'est-à-dire sur rien du tout, côté sécurité.
--
-- C'est aussi une violation directe de l'accord API Strava : les données Strava
-- d'un athlète ne peuvent être affichées qu'à cet athlète (§2.3 et §6.1 de l'API
-- Policy), et `bike_stats` expose `total_km` et `strava_gear_id`.
--
-- À noter : `activity_bike_stats` (migration 20260725000001) a bien été créée avec
-- `security_invoker = true`. Seules les deux vues d'origine étaient concernées.
--
-- Correction par `alter view` et non `create or replace view` : la définition de
-- ces vues a été modifiée par plusieurs migrations successives (20260523000004,
-- 20260524000001). Réécrire le corps ici risquerait de revenir à une version
-- antérieure. On ne change que l'option de sécurité.
--
-- Effet sur le fonctionnement : aucun. Les requêtes légitimes filtrent déjà par
-- utilisateur ; elles retourneront exactement les mêmes lignes. Seules les lectures
-- non filtrées, qui n'existent nulle part dans le code, changent de comportement.
-- ============================================================

alter view public.component_stats set (security_invoker = true);
alter view public.bike_stats set (security_invoker = true);

comment on view public.component_stats is
  'Vue dénormalisée des composants. security_invoker = true : la RLS de components/bikes s''applique à l''appelant. NE JAMAIS recréer cette vue sans cette option.';

comment on view public.bike_stats is
  'Vue dénormalisée des vélos avec coûts agrégés. security_invoker = true : la RLS de bikes/components s''applique à l''appelant. NE JAMAIS recréer cette vue sans cette option.';

-- ── Contrôle après application ────────────────────────────────
--
-- Doit renvoyer les trois vues avec security_invoker=true :
--
--   select c.relname, c.reloptions
--   from pg_class c
--   join pg_namespace n on n.oid = c.relnamespace
--   where n.nspname = 'public' and c.relkind = 'v';
--
-- Test fonctionnel, depuis la console du navigateur en étant connecté :
--
--   const { data } = await supabase.from('bike_stats').select('id,user_id,name')
--
-- Avant : les vélos de tous les utilisateurs. Après : uniquement les siens.
