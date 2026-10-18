# Plateforme de signalements — FFSA

Application web de signalement confidentiel de violences et de questions éthiques
(Fédération Française de Sport Adapté).

- **Public** : dépôt d'un signalement écrit ou vocal, anonyme ou non (`/depot`), liens d'aide (`/liens-utiles`).
- **Administrateurs** (connexion requise) : suivi des signalements, déchiffrement, changement de statut, commentaires, journal des accès (`/suivi`, `/suivi/[id]`, `/admin/decrypt`).

---

## 1. Architecture

| Élément | Choix |
|---|---|
| Framework | Next.js 16 (App Router) / React 19 / TypeScript / Tailwind 4 |
| Hébergement | Vercel (aucune configuration spécifique : pas de `vercel.json`, pas de cron) |
| Base de données, authentification, fichiers | Supabase (Postgres, Auth e-mail + mot de passe, Storage) |
| E-mails (réinitialisation de mot de passe) | SMTP du client |
| Node.js | 20.9 ou plus récent |

### Chiffrement des données

Les contenus sensibles sont chiffrés en **AES-256-GCM** (clé dérivée par PBKDF2) **côté serveur**,
avant d'être enregistrés : texte du signalement, nom, téléphone, fichier audio.
Le chiffrement et le déchiffrement passent uniquement par des Server Actions
(`app/actions/submit-signalement.ts` et `app/actions/decrypt.ts`).
La clé `ENCRYPTION_KEY` ne quitte jamais le serveur.

> Ce chiffrement protège contre une fuite de la base ou du stockage.
> Il n'est **pas** « de bout en bout » : le serveur voit le contenu au moment du dépôt.

### Flux de données

1. Le visiteur remplit le formulaire. Le navigateur envoie le contenu en clair (en HTTPS) à la Server Action `actionSubmitSignalement`.
2. Le serveur valide, chiffre, téléverse l'audio chiffré dans le bucket privé `depots`, puis insère la ligne dans `signalements`.
3. Un administrateur connecté lit la ligne chiffrée, et les actions `actionDecryptText` / `actionDecryptAudio` la déchiffrent. Chaque consultation et chaque changement de statut sont tracés dans `journal_acces`.

---

## 2. Comptes à ouvrir (au nom du client)

| Service | Usage | Remarque |
|---|---|---|
| **GitHub** | Dépôt du code | Organisation ou compte du client. Le dépôt lui est transféré. |
| **Vercel** | Hébergement du site |
| **Supabase** | Base, authentification, stockage | région UE (Paris ou Francfort). Le plan gratuit met le projet en pause après une période d'inactivité : prévoir le plan Pro. Tarif actuel : 25$/mois. |
| **Service SMTP** | E-mails d'authentification |
| **Registrar de domaine** | Nom de domaine | Ex: signal-ffsa.fr à 7,79€/an |

Aucun autre service payant ni clé d'API tierce n'est requis.

---

## 3. Variables d'environnement

À renseigner dans Vercel (Settings → Environment Variables) pour les environnements Production et Preview, et dans `.env.local` en local.

| Variable | Visible du navigateur | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | oui | URL du projet Supabase (Project Settings → API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | oui | Clé `anon` / publique du projet Supabase |
| `ENCRYPTION_KEY` | **non** | Secret de chiffrement. Voir la section 7. |

Génération d'une `ENCRYPTION_KEY` (32 octets aléatoires) :

```bash
openssl rand -base64 32
```

**À ne pas faire :**
- Ne jamais créer de variable `NEXT_PUBLIC_ENCRYPTION_KEY` : toute variable préfixée `NEXT_PUBLIC_` est embarquée dans le JavaScript public.
- Ne jamais commiter de fichier `.env*` (déjà exclus par `.gitignore`).
- La clé `service_role` de Supabase n'est pas utilisée par l'application et ne doit pas être ajoutée.

---

## 4. Mise en place de Supabase

1. Créer un nouveau projet (région UE) et noter le mot de passe de la base dans un gestionnaire de mots de passe.
2. **SQL Editor** : exécuter d'un bloc le fichier [`supabase/setup-projet-client.sql`](supabase/setup-projet-client.sql). Il crée les tables `signalements`, `journal_acces` et `commentaires_signalement`, leurs droits, leur RLS, leurs politiques, et le bucket privé `depots`.
3. **Authentication → Sign In / Providers** : **désactiver** « Allow new users to sign up ».
   Dans ce projet, tout utilisateur authentifié est administrateur : si les inscriptions restent ouvertes, n'importe qui peut créer un compte avec la clé publique et lire les signalements.
4. **Authentication → Users → Add user** : créer chaque administrateur, avec l'e-mail confirmé.
   Administrateurs prévus : `<À DETERMINER>`.
5. **Authentication → URL Configuration** :
   - Site URL : `https://<À COMPLÉTER : domaine>`
   - Redirect URLs : `https://<À COMPLÉTER : domaine>/reset-password`
6. **Authentication → SMTP Settings** : renseigner le service SMTP du client (avec SPF et DKIM configurés sur le domaine d'expédition).
7. Contrôler les droits en exécutant, **une par une**, les requêtes de vérification en commentaire à la fin du script SQL.

---

## 5. Déploiement sur Vercel

1. Importer le dépôt GitHub (Add New → Project). Framework détecté automatiquement : Next.js.
2. Ajouter les trois variables d'environnement (section 3).
3. **Settings → Functions → Function Region** : choisir la région la plus proche de Supabase (par exemple Paris `cdg1` pour un projet Supabase à Paris).
4. Déployer.
5. **Settings → Domains** : ajouter le domaine du client, puis créer les enregistrements DNS indiqués par Vercel chez le registrar.
6. Vérifier que Site URL et Redirect URLs de Supabase (section 4, point 5) correspondent bien au domaine final.

Le site doit être servi en **HTTPS** (c'est le cas sur Vercel) : l'enregistrement vocal exige un contexte sécurisé.

---

## 6. Développement en local

```bash
npm install
cp .env.example .env.local   # puis renseigner les variables (section 3)
npm run dev                  # http://localhost:3001
```

Utiliser un projet Supabase **de test**. Pour reproduire la base, y exécuter `supabase/setup-projet-client.sql`.

Autres commandes : `npm run build`, `npm run start`, `npm run lint`.

---

## 7. Gestion de la clé de chiffrement

- Conserver `ENCRYPTION_KEY` dans un gestionnaire de mots de passe, en plus de Vercel. **Si elle est perdue, tous les signalements chiffrés deviennent illisibles, sans aucun moyen de récupération.**
- **Ne pas la modifier** sur un site contenant des données : les signalements existants ne pourraient plus être déchiffrés.
- En cas de suspicion de fuite de la clé, la rotation est prioritaire.

---

## 8. Recette avant mise en production

À dérouler sur l'environnement du client, avec le domaine définitif :

- [ ] Dépôt **écrit**, anonyme, puis non anonyme.
- [ ] Dépôt **vocal** (test sur ordinateur, Android et iPhone).
- [ ] Un enregistrement qui atteint la limite de **5 minutes** s'arrête seul et s'envoie correctement.
- [ ] Connexion administrateur, puis déchiffrement du texte, du nom, du téléphone et lecture de l'audio.
- [ ] Changement de statut, puis ajout d'un commentaire.
- [ ] Les consultations et les changements de statut apparaissent dans le journal des accès.
- [ ] « Mot de passe oublié » : l'e-mail arrive, le lien mène à `/reset-password`, le nouveau mot de passe fonctionne.
- [ ] Test d'accès depuis l'extérieur : `GET <SUPABASE_URL>/rest/v1/signalements?select=id` avec la clé `anon` doit renvoyer une erreur `permission denied` ou une liste vide, et jamais de données.
- [ ] Une ancienne URL publique d'un fichier du bucket `depots` renvoie une erreur (bucket privé).
- [ ] La création de compte depuis l'extérieur est refusée (inscriptions désactivées).
- [ ] Les pages `/suivi`, `/suivi/[id]` et `/admin/decrypt` redirigent vers `/login` quand on n'est pas connecté.

---

## 9. Exploitation

**Ajouter ou retirer un administrateur** : Supabase → Authentication → Users (Add user, ou suppression du compte). Les nouveaux comptes sont des administrateurs complets.

**Sauvegardes** : les sauvegardes quotidiennes sont incluses dans le plan Pro de Supabase (vérifier la durée de rétention). Les fichiers du bucket `depots` ne sont pas inclus dans les sauvegardes de la base : `<À COMPLÉTER : politique de sauvegarde des fichiers audio>`.

**Surveillance** : Supabase → Logs (API et Auth) pour repérer des accès anormaux ; Vercel → Logs pour les erreurs applicatives.

**Mises à jour** : exécuter `npm audit` et mettre à jour régulièrement Next.js et `@supabase/*`.

**Coûts récurrents** (à confirmer sur les grilles tarifaires en vigueur) : plan Vercel, plan Supabase, nom de domaine, service SMTP éventuel selon le volume.

---

## 10. Sécurité : points d'attention

- **RLS (Row Level Security) obligatoire.** Le navigateur interroge Supabase directement avec la clé publique : les politiques SQL sont la seule barrière d'accès. Toute nouvelle table doit avoir la RLS activée et des droits explicites.
- **Rôles** : l'application ne distingue pas de rôles. Tout compte authentifié est administrateur complet. Ne créer que des comptes de confiance, et garder les inscriptions désactivées.
- **Server Actions** : ce sont des endpoints HTTP publics. Toute action sensible doit vérifier elle-même la session (voir `requireUser()` dans `app/actions/decrypt.ts`) ; le middleware ne suffit pas.

---

## 11. Limites connues

- **Format audio** : l'enregistrement est forcé en `audio/webm;codecs=opus`. Sur un iPhone ou un Safari ancien qui ne gère pas ce format, l'enregistrement peut échouer. Gérer d'autres formats demanderait de stocker le type du fichier en base.
- **Durée et poids** : 5 minutes maximum par enregistrement (32 kbps, environ 1,2 Mo), et 3 Mo maximum côté serveur. Vercel plafonne les requêtes à environ 4,5 Mo.
- **Journal d'audit** : il est en insertion et lecture seules pour les administrateurs, mais un administrateur ayant accès au tableau de bord Supabase peut toujours modifier la base.

---

## 12. Structure du dépôt

```
app/
  actions/
    submit-signalement.ts   Dépôt : validation, chiffrement, enregistrement
    decrypt.ts              Déchiffrement et journal d'accès (session admin requise)
  lib/
    encryption.ts           AES-256-GCM / PBKDF2 (WebCrypto)
    supabase.ts             Client navigateur
    supabase-server.ts      Client serveur (session par cookies)
    statuts.ts              Libellés et couleurs des statuts
  depot/ login/ reset-password/ suivi/ admin/ liens-utiles/   Pages
components/                 Formulaire, enregistreur vocal, en-tête, modales
proxy.ts                    Protection des pages /suivi et /admin
supabase/
  setup-projet-client.sql   Création de la base, de la RLS et du bucket
```