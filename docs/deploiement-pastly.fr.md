# Mettre Pastly en ligne sur pastly.fr

Adresse principale : **https://pastly.fr**. `https://www.pastly.fr` redirige vers cette adresse. Cloudflare gère le DNS, Vercel héberge Next.js et Supabase héberge la base et les comptes.

## 1. Importer le dépôt dans Vercel

Dans **Vercel → Add New → Project**, importer **RangedCompany/pastly**. Si le dépôt de l’organisation n’apparaît pas, autoriser l’application GitHub Vercel à accéder à ce dépôt dans les paramètres de l’organisation.

Choisir **Next.js**, racine du dépôt et Node.js **24.x**. Les commandes standard conviennent : installation `npm ci`, build `npm run build`, dossier de sortie géré par Next.js.

Dans les variables de l’environnement **Production**, saisir :

| Variable                               | Valeur                                                        |
| -------------------------------------- | ------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | L’URL du projet Supabase configuré dans `.env.local`          |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | La même clé publique `sb_publishable_…` que dans `.env.local` |
| `NEXT_PUBLIC_SITE_URL`                 | `https://pastly.fr`                                           |

Les mots de passe et les variables `PASTLY_TEST_*` restent locaux. Ils ne sont pas nécessaires dans Vercel. Les tests réels ne sont pas lancés lors du build.

Déployer depuis Vercel. Le domaine `vercel.app` reste utile pour vérifier que l’application répond avant la propagation du domaine personnalisé. Une modification de variable publique nécessite un nouveau déploiement.

## 2. Ajouter les domaines dans Vercel

Dans le projet : **Settings → Domains** :

1. Ajouter `pastly.fr` et l’associer à l’environnement Production.
2. Ajouter `www.pastly.fr` et choisir une redirection permanente vers `pastly.fr`.
3. Relever pour chaque domaine le type, le nom et la valeur DNS affichés par Vercel. Les valeurs peuvent être propres au projet : utiliser celles de cet écran.

## 3. Saisir les enregistrements dans Cloudflare

Dans **Cloudflare → pastly.fr → DNS → Records → Add record** :

| Type    | Nom   | Contenu / cible                                         | Proxy                    | TTL  |
| ------- | ----- | ------------------------------------------------------- | ------------------------ | ---- |
| `A`     | `@`   | L’adresse IPv4 indiquée par Vercel pour `pastly.fr`     | **DNS only**, nuage gris | Auto |
| `CNAME` | `www` | La cible CNAME indiquée par Vercel pour `www.pastly.fr` | **DNS only**, nuage gris | Auto |

Le tableau décrit les types habituels. Si Vercel affiche une autre instruction pour ce projet, suivre son écran. Aucun nom de cible ni adresse IP propre au projet n’est inventé dans ce document.

Si Vercel demande une vérification de propriété, ajouter aussi le **TXT**, avec le nom et le contenu exacts qu’il affiche.

Remplacer les anciens enregistrements web `A`, `AAAA` ou `CNAME` qui entrent en conflit sur `@` ou `www`. Conserver les autres enregistrements, notamment les `MX` et `TXT` utilisés par la messagerie. Garder les serveurs de noms Cloudflare lorsque la zone y est déjà active. Si le domaine a été acheté chez un autre registrar et n’utilise pas encore Cloudflare, y définir les deux serveurs de noms attribués par Cloudflare à cette zone.

Le mode DNS only laisse Vercel gérer le trafic HTTPS et les certificats. Aucune règle Cloudflare « Cache Everything » ni redirection supplémentaire n’est nécessaire pour cette configuration.

Retourner dans Vercel et attendre **Valid Configuration** pour les deux domaines et un certificat HTTPS valide. Vérifier `https://pastly.fr` ainsi que la redirection de `https://www.pastly.fr`.

## 4. Mettre à jour Supabase Auth

Dans **Supabase → Authentication → URL Configuration** :

**Site URL** :

```text
https://pastly.fr
```

**Redirect URLs** :

```text
https://pastly.fr/auth/callback
https://pastly.fr/auth/callback?next=/reset-password
https://pastly.fr/auth/confirm
```

Les modèles d’email du README utilisent `{{ .SiteURL }}` : leurs liens pointeront vers `pastly.fr` après cette modification. La confirmation d’email doit rester activée. Configurer le SMTP personnalisé pour envoyer les emails aux utilisateurs extérieurs à l’équipe Supabase.

Conserver les URL locales seulement si ce même projet est encore utilisé en développement. Pour tester les emails sur localhost sans les envoyer vers la production, préférer un projet Supabase de développement distinct avec sa propre Site URL.

## 5. Recette après déploiement

- Accueil et Explorer accessibles sans connexion.
- Inscription, email de confirmation, connexion et déconnexion sur `pastly.fr`.
- Note publique visible dans Explorer et par lien anonyme.
- Passage en privé : disparition d’Explorer et contenu inaccessible en rechargeant l’ancien lien dans un autre navigateur.
- Réinitialisation par email et connexion avec le nouveau mot de passe.
- Redirection `www` vers le domaine principal, HTTPS valide et affichage mobile.

Les tests locaux et Supabase ne constituent pas une vérification d’un futur déploiement Vercel : cette recette doit être faite sur l’adresse réellement publiée.

Sources : [domaines personnalisés Vercel](https://vercel.com/docs/domains/working-with-domains/add-a-domain), [valeurs DNS propres au projet](https://vercel.com/docs/domains/set-up-custom-domain), [Vercel et les proxies](https://vercel.com/kb/guide/can-i-use-a-proxy-on-top-of-my-vercel-deployment), [statut du proxy Cloudflare](https://developers.cloudflare.com/dns/proxy-status/).
