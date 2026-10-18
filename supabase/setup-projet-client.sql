-- =============================================================================
-- Installation de la base du site de signalements FFSA — NOUVEAU projet Supabase
--
-- À exécuter d'un bloc dans SQL Editor, sur un projet vierge dédié à ce site.
-- Crée : 3 tables, contraintes, index, droits, RLS, politiques, bucket « depots ».
--
-- AVANT / APRÈS (à faire dans le dashboard, pas en SQL) :
--   • Authentication > Sign In / Providers : DÉSACTIVER « Allow new users to sign up ».
--     (Indispensable : sinon n'importe qui pourrait créer un compte et lire
--     tous les signalements, car « authentifié » = administrateur.)
--   • Authentication > Users : créer les comptes admin (Add user, e-mail confirmé).
--   • Authentication > URL Configuration : Site URL + Redirect URL /reset-password.
--   • Authentication > SMTP : brancher le service d'e-mail du client.
-- =============================================================================

begin;

-- ─── Droits par défaut : rien pour anon/authenticated sur les futures tables ──
alter default privileges in schema public revoke all on tables from anon, authenticated;

-- ─── signalements ────────────────────────────────────────────────────────────
create table public.signalements (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz default now(),
  audio_url           text,
  type_depot          text check (type_depot in ('vocal', 'ecrit')),
  texte_ecrit         text,   -- hérité : toujours NULL (contenu chiffré ci-dessous)
  anonyme             boolean default true,
  nom_prenom          text,   -- hérité : toujours NULL
  telephone           text,   -- hérité : toujours NULL
  statut              text default 'non_traite'
                        constraint signalements_statut_check
                        check (statut in ('non_traite', 'non_avenu', 'transmis_ethique',
                                          'transmis_discipline', 'traite')),
  texte_chiffre       text,
  texte_iv            text,
  texte_salt          text,
  audio_iv            text,
  audio_salt          text,
  nom_prenom_chiffre  text,
  nom_prenom_iv       text,
  nom_prenom_salt     text,
  telephone_chiffre   text,
  telephone_iv        text,
  telephone_salt      text
);

create index idx_signalements_type_depot on public.signalements (type_depot);

-- ─── journal_acces (journal d'audit) ─────────────────────────────────────────
create table public.journal_acces (
  id              uuid primary key default gen_random_uuid(),
  signalement_id  uuid references public.signalements (id) on delete cascade,
  utilisateur     text not null default 'invité',
  action          text not null,
  ancien_statut   text,
  nouveau_statut  text,
  created_at      timestamptz default now()
);

create index idx_journal_signalement on public.journal_acces (signalement_id);
create index idx_journal_date        on public.journal_acces (created_at desc);

-- ─── commentaires_signalement ────────────────────────────────────────────────
create table public.commentaires_signalement (
  id              uuid primary key default gen_random_uuid(),
  signalement_id  uuid references public.signalements (id) on delete cascade,
  auteur          text not null,
  contenu         text not null,
  created_at      timestamptz default now()
);

create index idx_commentaires_signalement_signalement_id
  on public.commentaires_signalement (signalement_id);

-- ─── Droits SQL ──────────────────────────────────────────────────────────────
revoke all on public.signalements             from anon, authenticated;
revoke all on public.journal_acces            from anon, authenticated;
revoke all on public.commentaires_signalement from anon, authenticated;

grant insert on public.signalements to anon;                       -- dépôt public
grant select on public.signalements to authenticated;              -- lecture admin
grant update (statut) on public.signalements to authenticated;     -- seul le statut est modifiable

grant select, insert on public.journal_acces            to authenticated;
grant select, insert on public.commentaires_signalement to authenticated;

-- ─── RLS ─────────────────────────────────────────────────────────────────────
alter table public.signalements             enable row level security;
alter table public.journal_acces            enable row level security;
alter table public.commentaires_signalement enable row level security;

-- signalements : le dépôt public ne peut contenir ni donnée en clair ni statut forcé
create policy "signalements_insert_anon" on public.signalements
  for insert to anon
  with check (texte_ecrit is null and nom_prenom is null and telephone is null
              and statut = 'non_traite');

create policy "signalements_select_admin" on public.signalements
  for select to authenticated using (true);

create policy "signalements_update_admin" on public.signalements
  for update to authenticated using (true) with check (true);

-- journal_acces : insertion + lecture seules, identité forcée à celle de l'utilisateur
create policy "journal_insert_admin" on public.journal_acces
  for insert to authenticated
  with check (utilisateur = (auth.jwt() ->> 'email'));

create policy "journal_select_admin" on public.journal_acces
  for select to authenticated using (true);

-- commentaires_signalement
create policy "Insertion authentifiée" on public.commentaires_signalement
  for insert to authenticated with check (true);

create policy "Lecture authentifiée" on public.commentaires_signalement
  for select to authenticated using (true);

-- ─── Storage : bucket privé « depots » ───────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('depots', 'depots', false, 3145728, array['application/octet-stream'])
on conflict (id) do update
  set public = false,
      file_size_limit = 3145728,
      allowed_mime_types = array['application/octet-stream'];

-- Les visiteurs déposent un fichier, sans pouvoir lister/lire/modifier/supprimer.
create policy "depots_insert_anon" on storage.objects
  for insert to anon
  with check (bucket_id = 'depots');

-- Seuls les admins connectés relisent les fichiers.
create policy "depots_select_admin" on storage.objects
  for select to authenticated
  using (bucket_id = 'depots');

commit;

-- ─── Vérifications (à lancer une par une après installation) ─────────────────
-- 1) RLS active sur les 3 tables :
--    select relname, relrowsecurity from pg_class
--    where relnamespace = 'public'::regnamespace and relkind = 'r';
-- 2) Droits effectifs :
--    select r.rolname, t.tbl,
--      has_table_privilege(r.rolname, 'public.'||t.tbl, 'SELECT') sel,
--      has_table_privilege(r.rolname, 'public.'||t.tbl, 'INSERT') ins,
--      has_table_privilege(r.rolname, 'public.'||t.tbl, 'UPDATE') upd,
--      has_table_privilege(r.rolname, 'public.'||t.tbl, 'DELETE') del
--    from (values ('anon'),('authenticated')) r(rolname),
--         (values ('signalements'),('journal_acces'),('commentaires_signalement')) t(tbl)
--    order by 1, 2;
-- 3) Politiques : select tablename, policyname, roles, cmd from pg_policies
--    where schemaname in ('public','storage') order by 1, 2;
