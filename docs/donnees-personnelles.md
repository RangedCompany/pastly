# Gestion des données personnelles de Pastly

Les textes publics sont les [CGU](https://pastly.fr/terms) et la [politique de confidentialité](https://pastly.fr/privacy). Leur code est dans `src/app/terms/page.tsx` et `src/app/privacy/page.tsx` ; les coordonnées et la date de version sont centralisées dans `src/lib/legal.ts`.

Éditeur et responsable du traitement, selon les coordonnées fournies : **RangedCompany**, **1B Rue de Mulhouse, 21000 Dijon, France**, **rangedace@rangedace.fr**. Aucune forme juridique, immatriculation, identité de directeur de publication ou désignation de DPO n’a été inventée. Compléter les mentions légales distinctes si le statut de l’éditeur l’exige.

## Fonctionnement décrit par les pages

- Notes publiques par défaut ; profil public sans email ; changement de visibilité et suppression depuis l’espace utilisateur.
- Authentification email ou Google via Supabase. Les informations Google de base peuvent être conservées dans Auth, même si Pastly n’en fait pas un nom public ou un avatar automatique.
- L’administration applicative voit les comptes et les volumes de notes privées, sans leur contenu. L’administration technique de l’infrastructure reste distincte.
- Vercel héberge le site ; Web Analytics et Speed Insights sont intégrés. Les événements admin sont exclus ; aucun gestionnaire de consentement ni bouton d’opposition spécifique aux mesures n’est actuellement implémenté. Ne pas présenter l’absence de cookies tiers comme une preuve d’exemption de consentement : l’appréciation dépend du fonctionnement et des paramètres effectifs des outils. Si un consentement est requis pour la configuration retenue, adapter le chargement des outils avant de les activer.
- Pas de suppression automatique des comptes inactifs, pas d’export ni de fermeture du compte en libre-service. Les demandes sont traitées manuellement par l’éditeur.
- Les cookies du SDK SSR ont actuellement un `maxAge` de 400 jours, renouvelé à leur réécriture ; la durée de validité de session côté Auth peut différer. Revoir le texte si ces options changent.

## Paramètres à relever sur les services réellement déployés

Le dépôt ne permet pas de certifier la région Supabase, les réglages de session, les offres Vercel/Supabase, les rétentions de journaux et de sauvegardes, ni le fournisseur SMTP réellement utilisé. La politique utilise donc des critères de conservation et mentionne les catégories de prestataires sans affirmer un hébergement exclusivement européen ou un délai d’effacement des sauvegardes non vérifié.

Lors de la mise en service, relever et documenter :

1. La région du projet Supabase et les lieux/accès de traitement des prestataires et sous-traitants. Vérifier leurs accords de traitement des données et les garanties de transfert applicables.
2. Les paramètres Auth : durée des sessions, éventuelle expiration pour inactivité et révocation des sessions.
3. Les rétentions effectives des journaux Supabase/Vercel, des sauvegardes, des statistiques et de l’historique `admin_role_events`. Cet historique n’a pas de purge automatique dans les migrations actuelles ; définir une procédure adaptée à sa finalité.
4. Le fournisseur SMTP et ses journaux de remise. Mettre à jour la politique si ses traitements nécessitent une information supplémentaire.
5. Les durées de conservation des correspondances, des demandes d’exercice des droits et des signalements dans la messagerie de l’éditeur. Mettre en œuvre leur revue et leur suppression une fois la finalité et les éventuelles nécessités probatoires expirées.

Reporter les durées précises dans la politique lorsqu’elles sont fixées et vérifiées. Ne pas promettre une purge qui n’est pas automatisée ou organisée. Les présentes pages constituent des textes adaptés à la version du service ; elles ne remplacent pas ces réglages et procédures.

## Traiter une demande d’accès, de rectification ou de suppression

1. Recevoir la demande à `rangedace@rangedace.fr`, noter sa date et identifier les données concernées. Répondre en principe sous un mois ; annoncer une éventuelle prolongation motivée dans ce premier mois.
2. Vérifier l’identité de façon proportionnée, de préférence au moyen de l’adresse déjà associée au compte et d’une vérification appropriée au risque. Ne jamais demander le mot de passe ou considérer une simple adresse écrite dans un message comme une preuve suffisante.
3. Pour un accès/export, rassembler uniquement les données du demandeur : Auth, profil, notes et autres données personnelles pertinentes, avec les informations sur les traitements. Protéger les données des tiers et utiliser un canal de remise adapté.
4. Pour une fermeture, expliquer la suppression du profil et des notes associés. Une personne habilitée réalise la suppression dans le bon projet Supabase après vérification de l’identifiant. Les clés étrangères des migrations suppriment le profil et les notes avec l’utilisateur Auth ; contrôler aussi les sessions, les identités liées, les autres données et les éventuelles copies détenues par les prestataires. Ne pas lancer une commande de suppression sur la seule base d’un email non vérifié.
5. Traiter séparément les données dont une conservation limitée est nécessaire pour une obligation légale, un incident ou un litige. Documenter le motif, le périmètre et l’échéance ; éviter de conserver tout un compte par défaut.
6. Vérifier le résultat, informer la personne et tenir compte de la rotation des sauvegardes. En cas de restauration, réappliquer les suppressions intervenues depuis la sauvegarde. Ne pas promettre de supprimer les copies publiques réalisées par des tiers.

Révoquer uniquement l’accès Google ne supprime pas le compte Pastly. Le flux d’inscription affiche les CGU et la confidentialité pour les deux méthodes ; il n’enregistre pas actuellement de preuve horodatée et versionnée d’acceptation dans une table dédiée.

## Recette des liens publics

- Ouvrir `/terms` et `/privacy` sans session, sur desktop et mobile, y compris sans JavaScript.
- Vérifier le pied de page, les deux liens sur `/signup`, la date, les coordonnées et les liens croisés.
- Après déploiement, tester les URL HTTPS réelles avant de les saisir dans [Google Auth Platform](auth-google.md).

Références : [information des personnes, CNIL](https://www.cnil.fr/fr/conformite-rgpd-information-des-personnes-et-transparence), [demandes d’accès, CNIL](https://www.cnil.fr/fr/repondre-une-demande-de-droit-dacces), [mesure d’audience, CNIL](https://www.cnil.fr/fr/node/677), [Web Analytics](https://vercel.com/docs/analytics/privacy-policy), [Speed Insights](https://vercel.com/docs/speed-insights/privacy-policy), [accord de traitement Supabase](https://supabase.com/legal/customer-resources/data-processing-addendum).
