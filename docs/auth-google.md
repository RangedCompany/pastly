# Connexion et inscription Google

Pastly utilise le fournisseur Google de **Supabase Auth**. Le même bouton connecte un utilisateur existant ou crée son compte lors de sa première connexion. Le profil Pastly est créé par les triggers existants, puis personnalisable dans `/profile`. Aucune migration SQL ni bibliothèque Google supplémentaire n’est nécessaire.

## 1. Configurer le projet Google Cloud existant

Ouvrir le projet dans [Google Cloud Console](https://console.cloud.google.com/), puis **Google Auth Platform** (ou **APIs et services → Écran de consentement OAuth**, selon l’interface).

1. **Branding / Présentation** : indiquer le nom **Pastly**, l’adresse d’assistance et l’adresse de contact. Pour la production, renseigner les valeurs du tableau ci-dessous et le domaine autorisé `pastly.fr`. Google peut demander la vérification de propriété du domaine.
2. **Audience** : choisir **Externe** pour accepter les comptes Google du public. Pendant la préparation, conserver le statut **Test** et ajouter les comptes qui feront les essais dans **Utilisateurs test**. Passer en production au moment de l’ouverture publique et suivre les éventuelles demandes de vérification affichées par Google.
3. **Data Access / Accès aux données** : utiliser uniquement l’identité de base : `openid`, email et profil (`userinfo.email`, `userinfo.profile`). Aucun accès à Gmail, Drive ou Calendar n’est demandé.
4. **Clients → Créer un client** : type **Application Web**, nom par exemple **Pastly Web**.
5. **Origines JavaScript autorisées** : `https://pastly.fr` et, pour le développement, `http://localhost:3000`. Le parcours actuel utilise une redirection serveur ; ces origines ne remplacent pas l’URI de redirection ci-dessous.
6. **URI de redirection autorisés** : copier l’URL **Callback URL (for OAuth)** affichée dans **Supabase → Authentication → Sign In / Providers → Google**. Pour un projet hébergé standard, elle ressemble à :

   ```text
   https://VOTRE_REFERENCE.supabase.co/auth/v1/callback
   ```

   Cette URI pointe vers Supabase. Le retour vers Pastly est configuré séparément à l’étape 3. Même avec Pastly sur localhost, utiliser le callback du projet Supabase hébergé si c’est ce projet qui gère Auth.
7. Créer le client, puis conserver son **Client ID** et son **Client Secret** dans un gestionnaire de secrets. Le secret peut n’être visible qu’au moment de sa création.

### Liens et identité à renseigner dans Google

| Champ Google Auth Platform | Valeur |
| --- | --- |
| Nom de l’application | Pastly |
| Page d’accueil de l’application | [https://pastly.fr](https://pastly.fr) |
| Règles de confidentialité | [https://pastly.fr/privacy](https://pastly.fr/privacy) |
| Conditions d’utilisation | [https://pastly.fr/terms](https://pastly.fr/terms) |
| Adresse d’assistance | `rangedace@rangedace.fr` |
| Domaine autorisé | `pastly.fr` |
| Éditeur / responsable du traitement | RangedCompany, 1B Rue de Mulhouse, 21000 Dijon, France |

Les pages [CGU](../src/app/terms/page.tsx) et [confidentialité](../src/app/privacy/page.tsx) sont accessibles sans compte et liées dans le pied de page ainsi que sur l’inscription, y compris pour Google. Leurs coordonnées communes sont dans [`src/lib/legal.ts`](../src/lib/legal.ts). Le [guide de gestion des données](donnees-personnelles.md) décrit les vérifications et le traitement des demandes.

Déployer cette version avant de soumettre ces liens à Google, puis ouvrir les deux URL en navigation privée sur `pastly.fr` : elles doivent répondre sans authentification. La présence des pages dans le dépôt ne signifie pas qu’elles sont déjà en ligne.

Pour le logo, utiliser le [PNG carré 120 × 120](../public/branding/pastly-google-120.png) ; le [logo vectoriel complet](../public/branding/pastly-logo.svg) reste disponible pour les autres usages. Google accepte PNG, JPG et BMP pour le logo de l’écran de consentement.

## 2. Activer Google dans Supabase

Dans **Supabase → Authentication → Sign In / Providers → Google** :

1. Activer **Enable Sign in with Google**.
2. Coller le **Client ID** du client Web et son **Client Secret**.
3. Conserver les contrôles de nonce et de vérification d’email par défaut ; aucune option de contournement n’est nécessaire.
4. Enregistrer.

Le Client ID et le secret sont configurés **uniquement dans Supabase**. Aucune variable `GOOGLE_CLIENT_SECRET`, clé de compte de service ou clé administrateur n’est nécessaire dans Pastly/Vercel.

Supabase gère les identités et leur éventuelle liaison avec un compte email existant. Pastly ne rapproche pas lui-même des comptes par email et ne copie pas les jetons Google dans ses tables. Lors de la recette, tester aussi un compte email/mot de passe existant avec la même adresse Google et vérifier que ses notes sont conservées.

## 3. Autoriser le retour vers Pastly

Dans **Supabase → Authentication → URL Configuration**, conserver la **Site URL** canonique `https://pastly.fr` en production et ajouter aux **Redirect URLs**, en plus des URL email existantes :

```text
https://pastly.fr/auth/callback?flow=google&next=**
```

Pour un environnement local qui utilise ce projet, ajouter également :

```text
http://localhost:3000/auth/callback?flow=google&next=**
```

Le motif `**` ne concerne que la destination dans la query string : le domaine et le chemin du callback sont fixes. Pastly valide ensuite `next` pour n’accepter qu’un chemin interne. Il permet de revenir à `/notes/new`, par exemple, après une demande de connexion. Utiliser le même hôte du début à la fin : `localhost` et `127.0.0.1` ne partagent pas leurs cookies. Pour un autre port de développement, adapter aussi `NEXT_PUBLIC_SITE_URL` et l’entrée autorisée.

Préférer un projet Supabase et un client Google distincts pour le développement. Pour les previews Vercel, configurer explicitement leur origine et leur callback sur l’environnement de test.

## 4. Afficher les boutons dans Pastly

Dans `.env.local`, puis dans **Vercel → Settings → Environment Variables** pour les environnements concernés :

```dotenv
NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true
NEXT_PUBLIC_SITE_URL=https://pastly.fr
```

En local, garder `NEXT_PUBLIC_SITE_URL=http://localhost:3000`. Les variables Supabase habituelles restent nécessaires. Redémarrer le serveur local ou lancer un nouveau déploiement Vercel : la variable publique est intégrée au build.

Sans activation explicite ou sans Supabase configuré, les boutons sont masqués et l’action serveur refuse de démarrer le parcours Google. Le flag ne vérifie pas la configuration distante du fournisseur : l’activer après les étapes précédentes. Le remettre à `false` permet de masquer Google tout en conservant les formulaires email.

## 5. Recette avec un vrai compte Google

1. Sur `/signup`, cliquer **Continuer avec Google** sans remplir les champs email/mot de passe. Choisir un compte Google autorisé et vérifier l’arrivée sur `/profile?welcome=1`, puis personnaliser le profil et créer une note.
2. Se déconnecter et utiliser Google sur `/login` : retrouver le même compte et ses notes, puis recharger pour vérifier la persistance de session.
3. Déconnecté, ouvrir `/notes/new`, puis utiliser Google : revenir à l’éditeur après connexion.
4. Annuler/refuser l’autorisation Google : un message français doit permettre de réessayer ou d’utiliser le formulaire email. Tester aussi un retour expiré/réutilisé.
5. Tester le compte email existant mentionné plus haut, un second compte Google, puis desktop et mobile sur le domaine réellement déployé.

`npm test` vérifie le démarrage, les redirections internes, les erreurs et la génération réelle du cookie/challenge PKCE avec le SDK SSR. `npm run test:e2e:google` vérifie les boutons et le départ OAuth dans Chrome desktop/mobile avec une destination Supabase interceptée, puis simule une annulation. Exécuter les suites navigateur successivement, car elles reconstruisent toutes `.next`. Le consentement Google, la configuration distante et une session réelle nécessitent cette recette manuelle ; ils ne sont pas validés par les tests hors ligne.

## Dépannage

- `redirect_uri_mismatch` : comparer l’URI de redirection du client Web Google à la **Callback URL** exacte du fournisseur Google dans Supabase.
- Google refuse un utilisateur pendant les essais : vérifier **Audience → Utilisateurs test**, le type d’audience et les éventuelles restrictions de l’organisation Google Workspace.
- Fournisseur désactivé : vérifier l’activation et les identifiants du fournisseur Google dans Supabase.
- Retour à la mauvaise adresse : vérifier `NEXT_PUBLIC_SITE_URL`, le nouveau build et la liste des **Redirect URLs** Supabase.
- Retour expiré ou session absente : recommencer dans le même navigateur et sur le même hôte, en autorisant les cookies. Le vérificateur PKCE doit rester disponible entre le départ et le retour.

Références : [Google avec Supabase](https://supabase.com/docs/guides/auth/social-sign-in/auth-google), [URL de retour Supabase](https://supabase.com/docs/guides/auth/redirect-urls), [OAuth Web Google](https://developers.google.com/identity/protocols/oauth2/web-server).
