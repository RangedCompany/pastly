# Pastly

Une petite place pour les grandes et petites idées. Pastly permet de créer des post-it colorés, publics par défaut, de les partager par lien ou de les garder privés. Interface entièrement en français, responsive et accessible au clavier.

Dépôt : [RangedCompany/pastly](https://github.com/RangedCompany/pastly). Domaine prévu : **https://pastly.fr**. Le [guide Cloudflare, Vercel et Supabase](docs/deploiement-pastly.fr.md) donne les étapes et les enregistrements à préparer pour ce domaine.

## Stack et prérequis

Next.js 16 (App Router), React 19, TypeScript strict, Tailwind CSS 4, Lucide, Supabase PostgreSQL/Auth et `@supabase/ssr`. Node.js **24 LTS** et npm. TypeScript 6 et ESLint 9 sont utilisés pour rester compatibles avec le parseur et les plugins du preset Next.js actuel ; les versions exactes sont verrouillées dans `package-lock.json`. ESLint 9 signale sa fin de support : sa montée de version attend la compatibilité des plugins React, import et accessibilité du preset.

## Démarrer

```powershell
npm ci
Copy-Item .env.example .env.local
```

Sous macOS/Linux : `cp .env.example .env.local`.

Renseignez les variables dans `.env.local` :

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://votre-reference.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Dans Supabase, ouvrez **Connect** ou **Settings → API Keys** pour obtenir l’URL du projet et la clé **publishable**. Une ancienne clé publique `anon` JWT reste acceptée dans cette même variable. N’utilisez jamais de clé `service_role` ni `sb_secret_...`. Aucune clé administrateur n’est nécessaire à l’application.

`.env.local`, tous les autres fichiers `.env*` (hors exemple) et les fichiers Vercel locaux sont ignorés par Git. Les variables `NEXT_PUBLIC_*` sont publiques : ne jamais y mettre de secret.

Sans configuration, les pages de présentation fonctionnent et Explorer explique la configuration manquante. Aucune donnée fictive n’est présentée comme issue de la base. Les post-it de l’accueil sont explicitement illustratifs.

## Créer et configurer Supabase

1. Créez un projet dans [Supabase](https://supabase.com/dashboard). Conservez le mot de passe PostgreSQL en lieu sûr, hors du dépôt.
2. Dans **SQL Editor → New query**, exécutez entièrement le fichier `supabase/migrations/202610290001_postly.sql`, **une seule fois**. Il crée les tables, contraintes, index, triggers, droits et policies RLS en transaction.
3. Alternative CLI, avec une CLI Supabase installée :

   ```sh
   supabase login
   supabase link --project-ref VOTRE_REFERENCE
   supabase db push
   ```

   Ces commandes modifient le projet lié : vérifiez sa référence avant de les lancer. Aucune migration distante n’est lancée automatiquement par le build ou la CI.

4. La migration est additive et ne supprime aucune table. Si vous possédez déjà des tables `profiles` ou `notes`, comparez leur schéma, leurs policies et leurs privilèges avant application. Un schéma incompatible doit être adapté par une nouvelle migration ; ne supprimez pas les tables pour contourner une erreur. Les policies PostgreSQL permissives se combinent par OR : aucune ancienne policy plus large ne doit rester active.
5. Dans **Authentication → Sign In / Providers → Email**, activez email/mot de passe et **Confirm email**. Réglez la longueur minimale du mot de passe à **12** caractères pour aligner Auth et l’interface. Les actions d’inscription et de réinitialisation valident également cette longueur côté serveur.
6. Dans **Authentication → URL Configuration**, définissez **Site URL** à `http://localhost:3000` pour le développement. Ajoutez aux **Redirect URLs** :

   ```text
   http://localhost:3000/auth/callback
   http://localhost:3000/auth/callback?next=/reset-password
   http://localhost:3000/auth/confirm
   ```

7. Dans **Authentication → Email Templates**, modifiez les liens comme ci-dessous pour permettre l’ouverture sur un autre appareil, sans dépendre du navigateur ayant initié le PKCE :

   **Confirm signup** :

   ```html
   <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email"
     >Confirmer mon inscription à Pastly</a
   >
   ```

   **Reset password** :

   ```html
   <a
     href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery"
     >Choisir un nouveau mot de passe</a
   >
   ```

   Pour ces modèles, `.SiteURL` doit correspondre à l’environnement utilisé. Utilisez de préférence un projet Supabase distinct pour le développement et la production. Le callback `/auth/callback` reste fourni pour les liens PKCE Supabase standard (même navigateur).

8. Configurez un **SMTP personnalisé** avant d’ouvrir les inscriptions au public (**Project Settings / Authentication → SMTP Settings**, selon l’interface Supabase). Le service email intégré Supabase impose des limites et n’assure pas un envoi général à tous les destinataires. Les quotas gratuits et les protections Auth s’appliquent. Réglez les limites de débit Auth et, si nécessaire, les protections anti-abus dans Supabase.

Les profils sont créés à l’insertion de `auth.users`, sans attendre de session ni dépendre de l’email. Un nom unique `membre_<uuid>` est attribué puis personnalisable dans `/profile`. Si le trigger de profil échoue, l’inscription n’est pas annulée : la fonction `ensure_my_profile`, réservée aux utilisateurs authentifiés et sans argument propriétaire, retente la création lors de l’accès au profil ou de la première note.

## Utilisation locale

```sh
npm run dev
```

Ouvrez [localhost:3000](http://localhost:3000).

| Route                                 | Fonction                                                                      |
| ------------------------------------- | ----------------------------------------------------------------------------- |
| `/`                                   | Présentation et exemples illustratifs                                         |
| `/explore`                            | Mur public, recherche titre/contenu, pagination de 12, tri récent             |
| `/dashboard`                          | Toutes ses notes, recherche, filtre public/privé, gestion                     |
| `/notes/new`                          | Éditeur, six couleurs et visibilité publique par défaut                       |
| `/notes/[id]`                         | Lecture selon les droits RLS ; même page introuvable pour absent/inaccessible |
| `/notes/[id]/edit`                    | Édition par le propriétaire                                                   |
| `/login`, `/signup`                   | Connexion et inscription email/mot de passe                                   |
| `/forgot-password`, `/reset-password` | Demande et changement de mot de passe                                         |
| `/auth/callback`, `/auth/confirm`     | Échange PKCE et vérification du token d’email                                 |
| `/profile`                            | Modification du nom affiché et du nom unique                                  |
| `/u/[username]`                       | Profil public, date d’inscription et seules notes publiques                   |

## Sécurité et confidentialité

- **RLS sur les deux tables**. La lecture d’une note exige `is_public` ou le propriétaire authentifié. Les écritures exigent le propriétaire, même par appel direct à l’API Supabase.
- L’identité du propriétaire provient de `auth.getUser()` côté serveur, jamais d’un champ caché, d’un email ou de métadonnées client. Les clauses `owner_id` des actions s’ajoutent à RLS.
- Un trigger protège l’identité, le propriétaire et la date de création des notes. Les privilèges de colonne empêchent aussi leur mise à jour ; `updated_at` est géré par PostgreSQL.
- La table `profiles` ne contient **aucun email**. Seuls le nom affiché, le pseudonyme, l’identifiant et la date d’inscription sont publics. L’adresse email reste dans Supabase Auth.
- Sessions par cookies `@supabase/ssr`, rafraîchissement dans `src/proxy.ts` avec `getClaims`, contrôle courant de l’utilisateur avec `getUser`. Aucune autorisation fondée sur `getSession` non vérifié.
- Les requêtes Supabase serveur et les réponses des pages sont sans cache partagé (`no-store`, rendu dynamique). Les liens de notes ne sont pas préchargés. Les métadonnées individuelles sont génériques et ne reprennent aucun texte de note, même publique.
- Le passage en privé prend effet dès le commit en base pour les futures lectures publiques, y compris l’ancien lien et l’API directe. Il ne peut pas effacer une copie ou une page déjà ouverte chez un lecteur ; rechargez la page pour vérifier les nouveaux droits.
- Texte brut rendu par React : aucun HTML utilisateur injecté. Validation Zod et contraintes SQL bornent titre, contenu, couleur et pseudonyme. La recherche échappe les délimiteurs PostgREST et les jokers LIKE.
- Les Server Actions Next.js utilisent POST et les contrôles d’origine du framework. Redirections internes validées et en-têtes de protection de base. Aucun OAuth Google factice.
- Le dialogue natif de suppression gère focus et clavier. Statuts accessibles, libellés de champs, liens d’évitement et réduction des animations selon les préférences du système.

## Vérifications

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

`npm run test:e2e` construit puis lance automatiquement le serveur **de production** sur `127.0.0.1:3100`, sans identifiants Supabase, même si `.env.local` est configuré. Les variables publiques étant intégrées au build par Next.js, cette reconstruction assure l’isolation des tests hors ligne. Les tests utilisent Chrome installé ; sinon exécutez `npx playwright install chrome`. Ils vérifient l’accueil et Explorer en desktop/mobile, les redirections des routes protégées, les formulaires, les états sans configuration, la recherche, les réponses sans cache et les pages introuvables. Captures et traces sont conservées dans `test-results/offline/` selon les résultats.

`npm test` exécute les validations et **la migration réelle sur PostgreSQL embarqué PGlite** avec rôles `anon`/`authenticated`. Les cas couvrent lecture publique, création anonyme interdite, usurpation, passage public → privé, ancien lien par identifiant, accès d’un autre utilisateur, modification/suppression par propriétaire, immuabilité, contraintes, timestamps, profils et réparation après échec. PGlite n’est pas un projet Supabase : il ne vérifie ni PostgREST, ni les emails, ni les sessions Auth réelles.

### Intégration Supabase réelle (à exécuter manuellement)

Sur un **projet de test dédié** avec la migration appliquée, préparez deux comptes confirmés distincts. Ajoutez dans `.env.local` (jamais dans Git) :

```dotenv
PASTLY_INTEGRATION_CONFIRM=dedicated-test-project
PASTLY_TEST_USER_A_EMAIL=compte-a@votre-domaine.fr
PASTLY_TEST_USER_A_PASSWORD=une-phrase-de-test-A
PASTLY_TEST_USER_B_EMAIL=compte-b@votre-domaine.fr
PASTLY_TEST_USER_B_PASSWORD=une-phrase-de-test-B
```

```sh
npm run test:integration
```

Ce script utilise uniquement la clé publique et les sessions des deux utilisateurs. Il crée un post-it temporaire, vérifie les autorisations **via l’API Supabase réelle**, passe la note en privé, vérifie sa disparition et son inaccessibilité puis la supprime, y compris en nettoyage après échec. Il ne crée ni ne supprime de compte. Sans configuration et confirmation explicite du projet de test, il s’arrête avec le code 2 : **ce n’est pas un test réussi**.

Pour vérifier aussi l’application complète avec ces mêmes comptes :

```sh
npm run test:e2e:live
```

Cette commande reconstruit l’application avec la configuration locale, puis lance les parcours réels en desktop et mobile sur `127.0.0.1:3101` : connexion, persistance de session, modification du profil, création et édition de note, recherche avec caractères spéciaux, partage, profil public, passage en privé, ancien lien inaccessible, refus pour le second compte, retour en public et suppression avec confirmation. Les notes temporaires sont supprimées et le profil initial est restauré, même après échec. Les traces/vidéos sont désactivées pour ne pas enregistrer les mots de passe saisis ; une capture du tableau de bord est enregistrée dans `test-results/live/`.

Les deux suites navigateur reconstruisent `.next` : exécutez-les **successivement**. Après la suite hors ligne, lancez `npm run build` ou la suite réelle pour restaurer un build connecté à votre configuration. Les tests réels ne sont pas lancés par la CI sans identifiants.

Le nom historique `202610290001_postly.sql` et ses identifiants SQL sont conservés : cette migration a déjà été appliquée et ne doit pas être réécrite après le renommage en Pastly. L’application et ses nouvelles variables de tests utilisent le nom Pastly.

### Recette manuelle avec Supabase configuré

1. Sans compte, ouvrir Explorer et une note publique ; tenter `/notes/new` : redirection vers connexion.
2. S’inscrire avec une vraie boîte email, ouvrir le lien de confirmation, personnaliser le profil et se reconnecter après déconnexion.
3. Créer une note publique. Vérifier sa présence dans Explorer et le profil public, chercher un mot du titre puis du contenu.
4. Copier son lien et l’ouvrir dans une fenêtre privée. Le contenu doit être visible.
5. Depuis le compte propriétaire, passer cette note en privé. Recharger Explorer, le profil public et l’ancien lien dans la fenêtre privée : note absente et contenu inaccessible.
6. Connecter un second utilisateur. Vérifier l’ancien lien, puis les appels directs de lecture/modification/suppression (le script d’intégration automatise ces contrôles).
7. Depuis le propriétaire, vérifier lecture, édition, six couleurs, retour en public puis suppression avec annulation/confirmation.
8. Demander une réinitialisation, ouvrir l’email, changer le mot de passe, puis se connecter avec le nouveau mot de passe. Tester aussi un lien expiré/réutilisé.
9. Vérifier persistance de session après rechargement, déconnexion, recherche et pagination avec plus de 12 notes, filtre privé/public, nom d’utilisateur déjà pris et affichage mobile.

La CI GitHub exécute lint, types, tests SQL/validation, build et tests navigateur sans accès à un projet Supabase distant.

## Déploiement Vercel

1. Publiez le dépôt GitHub quand vous le souhaitez, puis **Vercel → Add New → Project → Import Git Repository**. Choisissez le preset **Next.js**, racine du dépôt, Node.js **24.x** ; commandes standard `npm ci` / `npm run build`, sortie gérée par Next.js.
2. Ajoutez **NEXT_PUBLIC_SUPABASE_URL**, **NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY** et **NEXT_PUBLIC_SITE_URL** dans **Settings → Environment Variables**. Pour ce projet, l’URL canonique est `https://pastly.fr`. Aucun secret administrateur requis. Les étapes DNS Cloudflare sont détaillées dans [le guide de déploiement](docs/deploiement-pastly.fr.md).
3. Appliquez la migration au projet Supabase choisi et configurez Auth avant l’ouverture publique. Aucun build ne le fait à votre place.
4. Remplacez la **Site URL** Supabase par le domaine HTTPS canonique et ajoutez les trois URL de callback/confirmation avec ce domaine. Conservez les URL locales uniquement si ce projet sert aussi au développement. Pour les previews, préférez un projet Supabase séparé avec son propre domaine autorisé ; les modèles `.SiteURL` sont canoniques.
5. Déployez depuis Vercel. Toute modification d’une variable `NEXT_PUBLIC_*` exige un **nouveau build**. Relancez la recette sur l’URL réellement déployée, notamment emails, passage en privé et ancien lien.

Aucun déploiement, push Git ou changement de projet Supabase distant n’est nécessaire au développement local et n’est automatisé ici.

### Vercel Web Analytics

Le paquet `@vercel/analytics` et le composant Next.js `<Analytics />` sont intégrés au layout racine pour mesurer les visites et les changements de page.

Dans le projet Vercel, ouvrez **Analytics** et activez **Web Analytics** si nécessaire. Déployez ensuite cette version et visitez le site pour alimenter le tableau de bord. Aucune variable d’environnement supplémentaire n’est nécessaire. Si les visites ne remontent pas, vérifiez les bloqueurs de contenu du navigateur.

Référence : [guide Vercel Web Analytics](https://vercel.com/docs/analytics/quickstart).

### Vercel Speed Insights

Le paquet `@vercel/speed-insights` et le composant Next.js `<SpeedInsights />` sont intégrés au layout racine pour mesurer les performances des pages auprès des visiteurs.

Dans le projet Vercel, ouvrez **Speed Insights** et activez le service si nécessaire. Déployez ensuite cette version et visitez plusieurs pages pour commencer la collecte. Aucune variable d’environnement supplémentaire n’est nécessaire. Si aucune mesure ne remonte, vérifiez les bloqueurs de contenu du navigateur.

Référence : [guide Vercel Speed Insights](https://vercel.com/docs/speed-insights/quickstart).

## Structure

```text
src/app/                 Pages App Router, callbacks et actions serveur
src/components/          Navigation, cartes, éditeur, formulaires, états et dialogues
src/lib/                 Auth, requêtes, validations, types et clients Supabase
src/proxy.ts             Rafraîchissement SSR et en-têtes sans cache
supabase/migrations/     Schéma SQL, triggers, privilèges et RLS
tests/                   Tests de validation et autorisations PostgreSQL
e2e/                     Tests navigateur desktop et mobile
e2e-live/                Parcours navigateur sur le projet Supabase de test
scripts/                 Intégration Supabase réelle à déclencher manuellement
.github/workflows/       Vérifications CI
```

## Limites V1

Texte brut uniquement, 120 caractères de titre et 5 000 de contenu, six couleurs, 12 notes par page et tri récent. Recherche partielle avec index trigrammes, sans classement sémantique. Le nom d’utilisateur modifie l’URL du profil sans redirection de l’ancien nom. Le bouton de partage nécessite un contexte sécurisé HTTPS ou localhost et l’autorisation du presse-papiers. Pas de commentaires, likes, abonnements, paiements, chat, administration, ni authentification Google. Les quotas et limites Auth/email/base dépendent de votre offre Supabase. Aucune garantie d’effacement des copies déjà téléchargées d’une note précédemment publique.

## Résultats de livraison locale — 29 octobre 2026

- Dépendances installées et verrouillées ; audit npm : aucune vulnérabilité signalée à l’installation.
- Lint sans erreur ni avertissement, contrôle TypeScript strict et build de production réussis.
- 53 tests de validation et de sécurité sur PostgreSQL embarqué réussis.
- 10 tests navigateur réussis sur le serveur de production, avec Chrome desktop et émulation mobile ; captures de l’accueil examinées dans les deux formats.
- Intégration sur le projet Supabase réel réussie : deux comptes, appels directs à l’API, RLS, passage en privé, droits de lecture/modification/suppression et absence d’email dans les profils publics.
- Deux parcours navigateur réels réussis, en desktop et mobile : connexion/déconnexion, persistance de session, profil, création, couleurs, recherche, partage, confidentialité, retour en public, édition et suppression. Les notes temporaires ont été supprimées et le profil de test restauré.
- **Inscription avec réception de l’email, confirmation par email et récupération de mot de passe non vérifiées de bout en bout** : les comptes fournis étaient déjà confirmés et aucun accès aux boîtes email n’a été fourni. Le réglage public Supabase confirme que l’email/mot de passe et la confirmation d’email sont activés.
- Aucun déploiement Vercel, changement DNS Cloudflare ou modification du schéma Supabase distant effectué par l’agent. La migration a été appliquée manuellement par le propriétaire du projet. La CI GitHub doit être distinguée des contrôles locaux ci-dessus.

La machine de développement ne proposait pas Node.js dans son PATH. Les contrôles ont utilisé une distribution portable Node 24.22.0 dans `%LOCALAPPDATA%\postly-tools\node-v24.22.0-win-x64`. Pour réutiliser ce runtime dans PowerShell :

```powershell
$env:Path = "$env:LOCALAPPDATA\postly-tools\node-v24.22.0-win-x64;$env:Path"
npm run dev
```

Sur une autre machine, installez simplement Node.js 24 LTS.

Références : [Supabase SSR et cookies](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [Server Actions Next.js](https://nextjs.org/docs/app/getting-started/mutating-data).
