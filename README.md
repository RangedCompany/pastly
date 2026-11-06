# Pastly V2

**Collez. Visualisez. Conservez. Partagez.**

Pastly transforme un texte collé en document lisible, diagramme, arbre de données, code coloré ou tableau. Le visualiseur de l’accueil fonctionne **sans compte et sans configuration Supabase**, dans le navigateur. Les comptes permettent de conserver les contenus dans une bibliothèque et de partager ceux rendus publics. Les notes colorées et les URL existantes restent disponibles.

## Démarrer

Node.js **24 LTS**, npm et les dépendances du dépôt sont nécessaires. La stack reste Next.js 16.4.3, React 19.3.1, TypeScript 6 strict, Tailwind 4, Lucide, Supabase PostgreSQL/Auth, `@supabase/ssr` et Zod 4.

```sh
npm ci
npm run dev
```

Ouvrir http://localhost:3000. Supabase est facultatif pour le rendu local. Pour les comptes, copier `.env.example` vers `.env.local` et renseigner :

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://votre-reference.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Utiliser uniquement une clé publique publishable ou anon, jamais de clé service_role. Les fichiers `.env*` hors exemple sont ignorés par Git. Les migrations ne sont jamais exécutées automatiquement par le build.

## Formats

| Format                   | Rendu et fonctions                                                                                                                             |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Texte brut / Note colorée | Retours à la ligne, espaces, copie, téléchargement, papier pastel pour les notes colorées                                                     |
| Markdown                 | Titres, listes, tableaux GFM, citations, liens, cases à cocher, blocs Shiki, Mermaid intégré, formules KaTeX                                   |
| Mermaid                  | Diagramme SVG réel, zoom, adaptation à la largeur, exports SVG et PNG                                                                          |
| JSON / YAML / TOML / XML | Arbre repliable, types colorés, copie de valeurs, ouverture progressive des grandes branches, diagnostics                                      |
| Code                     | Shiki : TypeScript, JavaScript, Python, Rust, Go, Java, C/C++, HTML, CSS, SQL et Bash ; numéros de ligne, aucun code exécuté                   |
| CSV / TSV                | Champs cités, guillemets et retours dans les cellules, recherche, tri, pagination locale et défilement ; première ligne utilisée comme en-tête |
| PNG / JPG / WebP / GIF   | Image locale, téléchargement de l’original                                                                                                     |
| SVG                      | Assainissement DOMPurify, retrait du contenu actif et des ressources externes, affichage en image isolée                                       |
| PDF                      | PDF.js, pages et zoom, rendu canvas ; aucun script, formulaire actif, lien ou pièce jointe activé                                              |
| DOCX                     | Extraction du texte avec Mammoth ; pas de reproduction de la mise en page ni des images Word                                                   |
| XLSX                     | Feuilles sélectionnables, valeurs enregistrées dans les cellules, tableau avec recherche et tri ; aucune formule ni macro exécutée             |

Les fichiers binaires ouverts dans le visualiseur restent locaux : **pas de téléversement automatique ni de sauvegarde binaire des documents**, pas de base64 dans PostgreSQL. Les photos de profil choisies explicitement sont enregistrées séparément dans le bucket public `avatars`. Un fichier non pris en charge affiche une explication ; l’original ouvert reste téléchargeable. Le téléchargement d’un CSV conserve sa source initiale : le tri et les filtres ne modifient pas le fichier.

Les images Markdown externes sont chargées uniquement après un clic explicite. Le HTML brut est ignoré en Markdown ; le format HTML est une vue de code, jamais une page exécutée. La détection et les renderers ne transmettent pas le texte à un service externe ou à une IA.

## Utilisation

L’interface est disponible en français, anglais, espagnol, allemand, italien, portugais, néerlandais et japonais. La langue est choisie dès le rendu serveur selon l’en-tête `Accept-Language` du navigateur (variantes régionales et priorités prises en compte), avec l’anglais en repli si aucune langue n’est prise en charge. Le sélecteur du pied de page permet de changer de langue sans perdre le document ouvert ; ce choix prend la priorité via un cookie `pastly-locale` pendant un an. Supprimer ce cookie réactive la détection automatique.

Les traductions sont des catalogues locaux dans `src/lib/i18n/messages/`, sans appel à un service de traduction pendant l’utilisation. Les contenus, titres, noms et fichiers des utilisateurs ne sont pas traduits. Les métadonnées, libellés accessibles, messages applicatifs, dates et pluriels suivent la langue choisie. Les diagnostics techniques provenant directement des bibliothèques peuvent garder leur formulation d’origine. Aucune colonne de préférence ni migration SQL n’est nécessaire.

Pour ajouter une langue : compléter `LOCALES` et `LANGUAGE_NAMES` dans `src/lib/i18n/locale.ts`, déclarer le chargement du catalogue dans `server.ts` et fournir toutes les clés du catalogue français en conservant les variables entre accolades. Utiliser `getTranslations()` dans les composants serveur et `useTranslations()` dans les composants clients. Les tests vérifient la couverture des catalogues, les variables et les parcours navigateur sur ordinateur et mobile.

- `/` : éditeur pleine largeur, collage au clavier, glisser-déposer, détection automatique ou choix manuel recherchable, modes Source/Aperçu/Divisé, plein écran, effacement, copie, téléchargement et sauvegarde.
- `/dashboard` : **Ma bibliothèque**, recherche, visibilité, filtre par format, pagination, modification, suppression et partage.
- `/explore` : galerie publique multiformat avec recherche et filtres.
- `/notes/new` : éditeur de notes colorées, six couleurs, privé par défaut.
- `/notes/[id]` : renderer correspondant au format sauvegardé ; URL historique conservée.
- `/notes/[id]/edit` : éditeur de notes colorées ou atelier source/aperçu selon le format.
- `/raw/[id]` : source exacte d’une note en texte brut ; lien consultable et copiable depuis sa page. Une note publique est accessible sans compte, une note privée uniquement avec la session de son propriétaire.
- `/profile`, `/u/[username]` : profil, photo personnalisée et publications publiques. Le crayon au survol de l’avatar (ou au focus clavier, toujours visible sur écran tactile) permet de choisir un JPG, PNG ou WebP non animé de 2 Mo maximum. La photo est enregistrée immédiatement, recadrée en carré de 512 pixels et réencodée en WebP sans métadonnées EXIF. Elle peut être remplacée ou supprimée et apparaît sur les publications.
- `/terms`, `/privacy` : pages légales publiques.

Le sélecteur affiche le format détecté et permet de rechercher un format ou de revenir à la détection automatique. Un changement de format ou de mode conserve la source. En mode Divisé, déplacer la séparation à la souris ou au toucher, ou utiliser les flèches au clavier après l’avoir sélectionnée. Un double-clic rétablit deux panneaux égaux ; la position reste limitée à 15–85 %. Sur mobile, les panneaux sont empilés et la séparation se déplace verticalement. La position est conservée pendant l’utilisation de l’éditeur, pas après un rechargement.

**Effacer** vide la source et l’aperçu, retire le nom du fichier et réactive la détection automatique ; ce bouton ne supprime aucune note enregistrée. L’aperçu est actualisé après 300 ms. Le téléchargement et la sauvegarde utilisent toujours la source courante.

Avant connexion, le bouton de sauvegarde propose de conserver explicitement le brouillon dans `sessionStorage` pour traverser la connexion dans **le même onglet**. Il est restauré sur `/?draft=1` puis retiré du stockage de session. Il n’existe aucune sauvegarde automatique persistante des collages. Télécharger un original avant de fermer l’onglet ; le parcours Google doit revenir dans cet onglet pour retrouver ce brouillon.

## Migration Supabase

Pour une installation neuve, appliquer les migrations dans cet ordre :

1. `supabase/migrations/202610290001_postly.sql`
2. `supabase/migrations/202610290002_admin.sql`
3. `supabase/migrations/202611050001_universal_viewer.sql`
4. `supabase/migrations/202611060001_profile_avatars.sql`

Pour une installation existante, appliquer uniquement les migrations manquantes, dans cet ordre. La quatrième ajoute `profiles.avatar_path`, les privilèges de colonne et le bucket public `avatars`. Les écritures Storage sont réservées au dossier de l’utilisateur connecté ; les images existantes ne sont pas écrasées. Un échec d’enregistrement du profil retire le nouvel objet ; un remplacement ou une suppression nettoie l’ancienne image via l’API Storage. Si ce nettoyage échoue, un avertissement serveur demande de le reprendre. Ne pas réexécuter ni modifier les migrations historiques. La migration V2 ajoute :

| Colonne             | Rôle                                                                                                                   |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `content_kind`      | `note`, `text`, `markdown`, `code`, `diagram` ou `data`                                                                |
| `format`            | Format précis ; `note` par défaut pour interpréter les anciennes lignes                                                |
| `original_filename` | Nom d’origine facultatif, sans chemin, 255 caractères au maximum                                                       |
| `metadata`          | Objet JSON fermé, actuellement `{}` uniquement ; une future extension exige une migration et une validation explicites |

Elle élargit la contrainte de longueur, ajoute les contraintes de cohérence format/type et les privilèges de colonne, puis des index de filtrage. Les policies RLS, triggers d’immuabilité, propriétaires, UUID, dates, couleurs et visibilités existantes sont conservés. Les anciennes lignes ne sont pas mises à jour : leur `updated_at` reste inchangé. Seul le **défaut des nouvelles insertions** devient privé.

Exécuter le fichier SQL complet dans le SQL Editor du projet choisi, ou utiliser la CLI après vérification du projet :

```sh
supabase login
supabase link --project-ref VOTRE_REFERENCE
supabase db push
```

Tester d’abord sur un projet dédié et déployer l’application **après** les migrations. Le code sélectionne explicitement les colonnes V2 et `avatar_path` et nécessite donc leur présence. Le stockage binaire est limité aux photos de profil. Les fonctionnalités Auth, Google et admin n’ont pas besoin d’être réécrites : voir [Google](docs/auth-google.md), [déploiement](docs/deploiement-pastly.fr.md), [données personnelles](docs/donnees-personnelles.md) et `supabase/bootstrap-admin.sql`.

Le [guide détaillé Supabase/Auth](docs/supabase-auth.md) conserve les modèles d’email et les paramètres historiques. Configurer Supabase Auth avec confirmation email, mot de passe minimal de 12 caractères et SMTP avant ouverture publique. Renseigner Site URL et les destinations `/auth/callback`, `/auth/confirm` et `/auth/callback?next=/reset-password` pour chaque environnement. Les modèles utilisant `token_hash` permettent la confirmation sur un autre appareil ; les détails du guide Auth restent applicables. Google reste facultatif via `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true` et sa configuration côté Supabase.

## Architecture et extension

Le détail des contrats et des garde-fous est décrit dans [l’architecture V2](docs/viewer-v2.md).

- `src/lib/viewer/types.ts` : formats, catégories, capacités, diagnostics et interface `RendererPlugin`.
- `detect.ts` : `detectContent()`, détection déterministe locale.
- `registry.ts` : `getRenderer()`, `getSupportedFormats()`, `renderContent()` ; chargement des parseurs à la demande.
- `parse.ts` et `parse.worker.ts` : parsing des données hors du fil UI, limite de durée et complexité.
- `files.ts`, `office.worker.ts`, `sanitize.ts` : validation des archives Office et assainissement SVG.
- `src/components/viewer/` : acquisition et édition, prévisualisation, composants de rendu et actions.
- `src/app/actions/notes.ts` : sauvegarde authentifiée existante, validation Zod et contrôle du propriétaire.

Pour ajouter un renderer : ajouter le format et son libellé, déclarer son plugin et ses capacités dans le registre, ajouter un parseur borné, enregistrer le composant chargé via `next/dynamic` dans `ContentPreview`, puis ajouter la détection, l’extension de fichier et les tests. Pour un format sauvegardable, une **nouvelle migration** doit étendre la contrainte format/type en même temps que les validations TypeScript. Ne pas ajouter un format seulement à l’interface sans implémenter son rendu.

La détection considère l’extension, puis un MIME reconnu, puis le contenu. Elle reconnaît le JSON valide, les déclarations Mermaid, les marqueurs Markdown et des signatures de code TypeScript, JavaScript, Python, Rust, Go, Java, C/C++, HTML, CSS, SQL et Bash. Certaines structures YAML, TOML et XML sont également reconnues sans extension. Les heuristiques restent conservatrices : le CSV et les contenus ambigus peuvent rester en texte brut ; le sélecteur permet de forcer leur format. La source n’est jamais reformatée silencieusement.

## Réactivité et accès raw

Les changements de mode, le redimensionnement, la détection, l’effacement, la copie et le téléchargement sont traités dans le navigateur. Le rendu peut charger ses modules à la demande, mais ces contrôles n’attendent aucune Server Action ni écriture Supabase.

L’affichage de la navigation et les lectures protégées utilisant `getIdentity` vérifient les claims de session avec `getClaims` ; les clés publiques JWKS peuvent être mises en cache par le SDK. Une récupération de clés, un rafraîchissement de session ou certains modes de signature peuvent encore nécessiter le réseau. Les actions de mutation et le profil utilisent toujours `getUser`. Sans cookie de session Supabase, le proxy ne lance pas de vérification Auth. Le contrôle du lien administrateur est rendu sous `Suspense` pour ne pas bloquer le reste de la page. Après une modification, seules les pages de bibliothèque, d’exploration, de profils publics et la note concernée sont invalidées, plutôt que tout le layout.

La lecture et la sauvegarde des notes nécessitent toujours Supabase. Ces optimisations réduisent les appels superflus sans garantir une latence en production ; mesurer séparément Auth, requêtes de données et rendu sur le déploiement cible.

La route raw utilise la session et les policies RLS habituelles, sans clé privilégiée ni lien secret supplémentaire. Elle renvoie `text/plain; charset=utf-8`, `nosniff` et `Cache-Control: private, no-store`, sans exécuter le HTML de la source. Une note inexistante ou masquée par RLS renvoie 404 ; une erreur de base renvoie 503. Passer une note en privé retire aussi l’accès raw anonyme lors des requêtes suivantes. Un lien raw privé nécessite les cookies du propriétaire et ne donne pas accès au contenu à un outil externe non authentifié.

## Limites et sécurité

| Limite                | Valeur                                                                                                                                              |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Titre                 | 120 caractères                                                                                                                                      |
| Note colorée          | 5 000 caractères                                                                                                                                    |
| Autre contenu textuel | 100 000 caractères (limite UI/Zod en unités UTF-16 ; SQL en caractères Unicode, donc la limite cliente est légèrement plus stricte pour les emojis) |
| Fichier local         | 10 Mio                                                                                                                                              |
| SVG importé           | 100 000 octets                                                                                                                                      |
| Mermaid               | 20 000 caractères, 200 arêtes, 500 lignes/instructions, 10 diagrammes intégrés par Markdown ; directives `init` et frontmatter désactivés           |
| Coloration Shiki      | 30 000 caractères ; source lisible au-delà                                                                                                          |
| Données structurées   | 20 000 valeurs, 80 niveaux ; 50 enfants chargés progressivement par branche                                                                         |
| CSV / TSV             | 10 000 lignes de données, 200 colonnes ; 100 lignes affichées par page                                                                              |
| Parsing des données   | Interrompu après 5 secondes dans un worker                                                                                                          |
| Archive Office        | 20 Mio déclarés décompressés, 5 Mio par entrée, 1 000 entrées ; médias exclus avant lecture                                                         |
| XLSX                  | 20 feuilles, 10 000 lignes et 200 colonnes par feuille, 50 000 cellules par feuille, 100 000 au total                                               |
| Parsing Office        | Worker interrompu après 15 secondes                                                                                                                 |
| PDF                   | 500 pages, rendu à la demande, 15 secondes par chargement/page, canvas borné à 4 096 pixels par côté                                                |
| Image raster          | 25 millions de pixels et 16 384 pixels par côté                                                                                                     |

Tout contenu est non fiable. Markdown passe par react-markdown, remark-gfm et rehype-sanitize, sans HTML brut. KaTeX est configuré avec `trust: false` et une expansion bornée ; un override maintient toutes ses dépendances sur la version corrigée. Shiki produit des tokens affichés avec React, sans injection HTML. Mermaid fonctionne en mode `strict`, sans configuration utilisateur, avec SVG nettoyé par DOMPurify puis affiché en image Blob, sans contexte de document actif. Les liens dangereux, entités XML, références YAML cycliques et structures excessives sont refusés. Les parseurs de fichiers lourds sont isolés dans des workers lorsqu’applicable et les Blob URL sont révoquées à la fermeture des vues.

Les originaux téléchargés restent les fichiers de l’utilisateur et ne deviennent pas « sûrs » par leur prévisualisation. Les protections limitent les risques mais ne constituent pas un antivirus. Les très grands documents ou syntaxes non compatibles affichent un diagnostic et gardent une source ou un original accessible. Le PNG Mermaid dépend du décodage SVG/canvas du navigateur ; l’export SVG reste disponible. Certains PDF utilisant des ressources CMap ou codecs spécifiques non embarqués peuvent ne pas se rendre : utiliser l’original. Le mode sombre, les miniatures de diagrammes en galerie, la mise en page DOCX fidèle et la sauvegarde binaire ne sont pas inclus.

Les notes privées restent protégées par RLS y compris en appel direct à Supabase. Les Server Actions prennent l’identité de la session vérifiée, jamais du formulaire. Les pages restent dynamiques et sans cache partagé ; les métadonnées individuelles ne contiennent jamais le texte d’un document. L’administration voit les volumes privés, pas leur contenu. La télémétrie exclut l’administration, la bibliothèque, les documents et les pages sensibles ; les paramètres de recherche et fragments sont retirés des autres événements. Les pages légales reflètent le défaut privé et doivent être revues par l’éditeur avant publication ; aucune garantie supplémentaire de région, de rétention ou de conformité n’est inventée.

## Vérifications

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
npm run test:e2e:google
```

Vitest teste les détecteurs, parseurs, limites, validations, sauvegardes serveur et réponses de la route raw (source exacte, en-têtes et erreurs). PGlite exécute les migrations SQL réelles et teste RLS, droits de colonnes, transition public/privé, compatibilité et préservation des anciennes lignes, profils et administration.

Playwright reconstruit un serveur de production sur `127.0.0.1:3100` **sans Supabase**, même si `.env.local` existe. Il teste les parcours anonymes desktop/mobile, les renderers réels, GFM/Mermaid/KaTeX/Shiki, erreurs, choix manuel, copie/téléchargements, fichiers Office/PDF, XSS et responsive, ainsi que la largeur de l’éditeur, le redimensionnement et l’effacement sans requête POST ni appel Supabase. Chrome est nécessaire : `npx playwright install chrome` si absent. Captures et traces d’échec sont dans `test-results/offline/`. Les suites navigateur reconstruisent `.next` : les lancer successivement.

Les tests distants sont **manuels, uniquement sur un projet Supabase de test dédié**, jamais sur la production :

```dotenv
PASTLY_INTEGRATION_CONFIRM=dedicated-test-project
PASTLY_TEST_USER_A_EMAIL=alice@votre-domaine.fr
PASTLY_TEST_USER_A_PASSWORD=une-phrase-de-test-A
PASTLY_TEST_USER_B_EMAIL=bob@votre-domaine.fr
PASTLY_TEST_USER_B_PASSWORD=une-phrase-de-test-B
```

```sh
npm run test:integration
npm run test:e2e:live
```

Deux comptes confirmés et les trois migrations sont requis. Les scripts utilisent uniquement des sessions utilisateur et la clé publique ; ils nettoient leurs contenus temporaires. Sans cette configuration ils refusent de démarrer, ce qui n’est pas un test réussi. PGlite et les actions simulées ne remplacent pas une session Auth/PostgREST réelle ; la recette connectée doit être réalisée avant déploiement.

## Déploiement

1. Appliquer et vérifier la migration V2 sur le projet cible après une recette sur un projet dédié.
2. Configurer les variables publiques et Auth sur Vercel/Supabase, puis reconstruire avec Node.js 24.
3. Vérifier collage anonyme, séparation ajustable, effacement, sauvegarde privée, réouverture, édition, galerie publique et anciennes URL avec deux utilisateurs. Vérifier le lien raw en public, puis son refus anonyme et pour l’autre utilisateur après passage en privé.
4. Vérifier les pages légales et réglages des prestataires ; voir les guides dans `docs/`.

Aucune migration distante ni mise en production n’est lancée par les tests. Après une suite hors ligne, reconstruire avec la configuration cible avant de déployer.
