# Administration de Pastly

La page `/admin` est réservée aux comptes administrateurs. Un bouclier apparaît dans la navigation pour ces comptes, sur ordinateur et mobile.

Elle présente :

- Les comptes Supabase Auth, y compris ceux dont le profil manque, avec recherche par email, nom, pseudo ou UUID et pagination de 20 comptes.
- Les filtres administrateurs, membres et emails à confirmer.
- Pour chaque compte : email, statut de confirmation, inscription, dernière connexion, date du dernier post-it créé et nombres de post-it publics et privés.
- Les totaux de comptes, administrateurs et notes, les inscriptions, connexions et notes créées sur les 7 derniers jours, les comptes sans note et les profils manquants.
- L’attribution et le retrait du rôle administrateur, avec confirmation et historique des 30 derniers changements.

La dernière connexion représente une authentification, pas une présence en ligne. Les données sont relues à chaque chargement ; **Actualiser** permet de les recharger.

## Activer la fonctionnalité

1. Dans le projet Supabase correspondant à l’environnement déployé, ouvrir **SQL Editor → New query**, avec le rôle `postgres`.
2. Exécuter intégralement `supabase/migrations/202610290002_admin.sql`, une seule fois, après la migration initiale. Cette migration ajoute deux tables et trois fonctions ; elle ne réécrit ni les profils ni les notes existantes.
3. Pour le premier administrateur, copier `supabase/bootstrap-admin.sql` dans une nouvelle requête. Remplacer `REPLACE_WITH_EMAIL` et `REPLACE_WITH_USERNAME` par l’email et le pseudo exacts du compte existant. Vérifier les valeurs, puis exécuter. Le compte doit avoir confirmé son email. La requête s’arrête si aucun compte ne correspond, si plusieurs comptes correspondent ou si un administrateur existe déjà.
4. Déployer la version contenant `/admin`. Se connecter avec le compte choisi, puis ouvrir le bouclier de la navigation ou `/admin`.
5. Les autres administrateurs sont ensuite gérés depuis cette page. Les nouveaux comptes restent toujours membres.

Les migrations et l’initialisation ne sont jamais exécutées par le build ou la CI. Avant l’application de la migration, les liens d’administration restent masqués. L’application utilise la clé publique et la session habituelles : aucune clé `service_role` ou secrète supplémentaire n’est nécessaire.

## Droits et confidentialité

Le serveur protège la page et les actions ; chaque fonction RPC vérifie aussi le rôle en base. Le rôle repose uniquement sur `admin_members`, jamais sur les métadonnées fournies par un utilisateur. Les tables de rôles et d’historique ne sont pas lisibles ni modifiables directement avec les rôles `anon` et `authenticated`, même pour un administrateur applicatif.

Chaque promotion ou révocation effective produit un événement dans la même transaction. Les opérations sont sérialisées ; les droits de l’auteur sont revérifiés après l’acquisition du verrou. On ne peut pas retirer ses propres droits ni promouvoir un compte dont l’email n’est pas confirmé. Une révocation est prise en compte dès la prochaine requête, y compris si l’ancienne page est encore ouverte.

Les administrateurs voient le **nombre** des notes privées, jamais leur titre ou contenu via la supervision. Les policies RLS des notes restent inchangées. Les profils publics ne publient ni email ni rôle. Les mots de passe, tokens et métadonnées Auth ne sont pas retournés. La page n’est pas indexable et ses événements sont exclus de Vercel Analytics et Speed Insights pour éviter d’y envoyer des recherches de comptes.

Les suppressions de comptes et la modération de notes ne font pas partie de cette page. Un propriétaire du projet Supabase peut rétablir les accès par SQL si nécessaire ; conserver cet accès hors de l’application.

## Vérification

`npm test` teste les deux migrations sur PostgreSQL embarqué PGlite : privilèges, refus anonyme et membre, contournements directs, statistiques, recherche littérale, pagination, changements de droits et audit. PGlite ne vérifie pas le service Supabase distant, PostgREST ou les vraies sessions.

Après migration et déploiement : vérifier `/admin` sans connexion (redirection), avec un membre (page introuvable), avec le premier admin (supervision), puis promouvoir un compte de test confirmé, se connecter avec celui-ci et vérifier son accès. Lui retirer les droits depuis l’autre compte admin et vérifier qu’un rechargement et une nouvelle action sont refusés. Vérifier aussi les nombres de notes privées sans accès à leur texte.

Référence : [sécuriser les fonctions PostgreSQL dans Supabase](https://supabase.com/docs/guides/database/functions).
