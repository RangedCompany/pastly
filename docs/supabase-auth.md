# Configuration Supabase et Auth

Ce guide conserve les paramètres Auth historiques de Pastly. Appliquer les trois migrations listées dans le README avant le code V2 ; sur une base existante, appliquer uniquement les migrations encore absentes.

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
