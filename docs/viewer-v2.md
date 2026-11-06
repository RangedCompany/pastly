# Architecture du visualiseur Pastly V2

## Parcours

`ViewerWorkspace` acquiert le texte (saisie, collage, fichier UTF-8) ou ouvre un binaire local. `detectContent` propose un format sans modifier la source. L’utilisateur peut le forcer. `ContentPreview` charge le composant adapté ; le registre expose les capacités et le parsing indépendant de React. La sauvegarde existante en Server Action conserve le texte exact avec le format, puis `/notes/[id]` sélectionne le même renderer.

La source est la valeur de référence. L’aperçu débouncé ne remplace jamais le texte à sauvegarder ou télécharger. Les modes changent uniquement l’affichage. Un contenu invalide peut être enregistré comme source : un diagnostic n’efface pas les données. La validation de persistance ne prétend pas certifier la syntaxe ou innocuité du fichier original.

L’atelier occupe toute la largeur disponible. `FormatPicker` remplace la liste native et les raccourcis d’exemples : il affiche le format détecté, propose une recherche et permet un choix manuel ou le retour en automatique. La détection privilégie l’extension puis le MIME, avant les signatures du contenu ; elle ne prétend pas reconnaître les syntaxes ambiguës avec certitude.

Le mode Divisé utilise deux panneaux et une séparation accessible au clavier, déplaçable par capture du pointeur. Les proportions sont bornées à 15–85 %, réinitialisables à 50 % par double-clic. Les panneaux sont côte à côte sur ordinateur, empilés sous 760 px ; la proportion vit dans l’état React de l’atelier. Effacer invalide les lectures de fichiers en cours, vide source et aperçu, retire le nom d’origine et réactive la détection ; aucune suppression en base n’est déclenchée.

## Contrat de plugin

`RendererPlugin` déclare `id`, `formats`, `extensions`, `mimeTypes`, `capabilities` et `parse(ContentInput, ContentFormat): Promise<ParseResult>`. Les parsers renvoient une valeur structurée ou des lignes et des diagnostics. `renderContent` borne l’entrée et transforme les exceptions en diagnostics. Son nom désigne la préparation des données ; le composant React reste dans `components/viewer`.

Les composants sont enregistrés explicitement, chargés à la demande. Les pages de galerie n’importent que les types/libellés et une portion de texte, jamais Mermaid, Shiki ou les bibliothèques Office. Le renderer texte conserve les retours ; le renderer de note colorée réutilise les couleurs existantes.

## Requêtes et réactivité

Les contrôles d’affichage, la détection, l’effacement et les exports sont locaux. Les modules de rendu sont chargés à la demande ; l’aperçu attend 300 ms après la saisie. Aucun clic sur ces contrôles ne lance une Server Action.

`getIdentity`, mémorisé pour le rendu courant avec React `cache`, vérifie les claims via Supabase `getClaims`. Il est utilisé par la navigation, la bibliothèque, les pages de lecture/édition et le contrôle du lien administrateur. Les clés JWKS peuvent être réutilisées par le SDK ; leur récupération, le rafraîchissement de session ou une configuration de signature symétrique peuvent encore nécessiter le réseau. `getUser` reste utilisé pour les mutations et les informations complètes du profil. Le proxy ne lance la vérification que lorsqu’un cookie de session Supabase est présent.

Le contrôle du lien administrateur reste une RPC en base et est rendu sous `Suspense` dans le layout. L’absence d’attente pour ce lien ne remplace pas les contrôles d’accès de `/admin` et de ses RPC. Les mutations de notes invalident la bibliothèque, Explorer, les profils publics et le détail concerné, sans invalider tout le layout. Les lectures restent sans cache partagé, afin de respecter les changements de visibilité.

Les lectures et écritures de notes restent des échanges réseau. Les tests hors ligne vérifient l’absence d’appels POST et Supabase pour les contrôles locaux ; ils ne mesurent pas la latence Vercel–Supabase en production.

## Sécurité et coût

- JSON/YAML/TOML/XML/CSV/TSV : worker dédié remplaçable, délai de 5 secondes, maximum 100 000 caractères, validation de profondeur et de volume. Pas de résolution d’entités externes XML ni de références YAML cycliques/partagées.
- Arbre : enfants créés uniquement à l’ouverture de la branche ; pagination de 50 valeurs. Le bouton d’expansion ouvre trois niveaux, pas 20 000 nœuds simultanément.
- Markdown : HTML ignoré, sanitation avant la génération KaTeX à configuration fermée. Les liens passent par la transformation d’URL sûre de react-markdown, et les liens externes utilisent `noopener noreferrer`. Les images distantes exigent un clic.
- Code : tokens Shiki rendus en spans React. Tout HTML est du texte. Aucun interpréteur, eval ou iframe de code utilisateur.
- Mermaid : traitement sérialisé parce que la configuration de la bibliothèque est globale, mode strict, 200 arêtes, source bornée, directives et frontmatter refusés. Le SVG nettoyé est affiché avec un élément image Blob ; aucun HTML actif de l’utilisateur n’est injecté dans le DOM Pastly. La bibliothèque Mermaid elle-même utilise un conteneur de calcul temporaire, supprimé en fin d’opération.
- SVG importé : DOMPurify avec profil SVG et retrait des liens, images, animations et foreignObject, retrait des ressources externes dans les styles ; image Blob isolée.
- Office : vérification de l’archive avant décompression, extraction XML/rels seulement, refus DTD/entités et dimensions aberrantes, réencapsulation d’une archive bornée puis bibliothèque de lecture, dans un worker interrompu après 15 secondes. Mammoth fournit du texte, affiché via React, sans HTML à assainir. XLSX fournit des valeurs, pas un moteur de calcul.
- PDF.js 6 : worker fourni par le paquet, sans ancien moteur de polices fondé sur eval (option `isEvalSupported` supprimée dans cette version), canvas uniquement. Les PDF ne sont jamais ouverts dans un iframe privilégié.

## Persistance

Une ligne `notes` garde son identité et sa politique RLS. `format='note'`/`content_kind='note'` sont les valeurs par défaut de compatibilité. `is_public=false` est le nouveau défaut d’insertion, sans mise à jour des lignes existantes. Les nouveaux formats doivent correspondre à la contrainte SQL de catégorie. La liste de formats, Zod et SQL sont testés ensemble.

`metadata` est actuellement fermé à `{}`. Cela évite un champ arbitraire pouvant cacher des données non validées ou des options dangereuses de renderer. Aucun chemin Storage ni type fichier sauvegardable n’est annoncé tant que la couche Storage privée, ses policies et le cycle de suppression ne sont pas implémentés.

## Source raw

`GET /raw/[id]` sélectionne uniquement `content` avec le client Supabase associé aux cookies de la requête. Les mêmes policies RLS protègent la page et la source : lecture anonyme des notes publiques, lecture privée réservée au propriétaire. Il n’existe pas de jeton de partage contournant ces droits. `RawLink` permet d’ouvrir la source ou de copier son URL absolue depuis la page de la note.

La réponse conserve la source exacte, sans mise en forme, et utilise `text/plain; charset=utf-8`, `X-Content-Type-Options: nosniff`, une CSP restrictive et `Cache-Control: private, no-store`. L’identifiant invalide, la note absente et le refus RLS donnent 404 ; une erreur de base donne 503 sans détail interne. La route n’est pas indexable. Les tests unitaires couvrent ces réponses avec un client simulé ; la recette connectée doit également vérifier les refus réels pour un autre utilisateur et après passage en privé.

## Extension

1. Ajouter l’identifiant à `FORMATS`, sa catégorie à `contentKind` et son libellé.
2. Déclarer le plugin dans `registry.ts` ; mettre les imports lourds dans un import dynamique.
3. Fournir un parseur borné dans le worker ou une stratégie explicitement documentée.
4. Ajouter le composant dans `ContentPreview`, avec états de chargement et erreur.
5. Déclarer les extensions et heuristiques conservatrices dans `detect.ts` ; tester les ambiguïtés et la priorité extension/MIME.
6. Étendre la contrainte SQL par une nouvelle migration si la sauvegarde est prévue ; contrôler les privilèges et la RLS.
7. Ajouter Vitest, PGlite et Playwright selon la surface modifiée. Vérifier les contenus hostiles et le responsive.

## Recette avant production

Les tests hors ligne ne couvrent pas le service Auth ni PostgREST réel. Utiliser les suites `test:integration` et `test:e2e:live` uniquement sur un projet de test confirmé, avec deux comptes distincts. Après migration, vérifier une ligne historique et un nouveau document, la lecture anonyme publique, la recherche et le filtrage, puis la révocation publique lors du passage en privé, pour la page et son URL raw. Vérifier aussi la détection, les choix manuels, la séparation sur ordinateur/mobile et l’effacement. Aucun token de test n’est nécessaire au build ou à la CI hors ligne.
