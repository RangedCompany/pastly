import { getTranslations } from "@/lib/i18n/server";
import type { Metadata } from "next";
import Link from "next/link";
import { LegalContact, LegalPage } from "@/components/legal-page";
import { legal } from "@/lib/legal";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t("Politique de confidentialité"),
    description: t(
      "Les données utilisées par Pastly, la connexion Google, les cookies, les prestataires et vos droits concernant vos données personnelles.",
    ),
    alternates: { canonical: "/privacy" },
  };
}

export default async function Privacy() {
  const t = await getTranslations();
  return (
    <LegalPage
      title={t("Politique de confidentialité")}
      description={t(
        "Quelles données sont utilisées, pourquoi, et comment garder la maîtrise de vos informations.",
      )}
    >
      <section>
        <h2>{t("1. Qui est responsable de vos données ?")}</h2>
        <p>
          {legal.publisher}{" "}
          {t(
            "est responsable des traitements de données personnelles nécessaires à l’exploitation de Pastly. Pour toute question relative à vos données ou pour exercer vos droits :",
          )}
        </p>
        <LegalContact />
        <p>
          {t(
            "Cette politique concerne pastly.fr. Les services extérieurs que vous choisissez d’utiliser, notamment votre compte Google, disposent également de leurs propres règles de confidentialité.",
          )}
        </p>
      </section>
      <section>
        <h2>{t("2. Les données utilisées")}</h2>
        <p>
          {t(
            "Le texte collé et les fichiers ouverts dans le visualiseur sont traités localement dans votre navigateur. Les fichiers binaires ouverts dans le visualiseur ne sont pas téléversés ni sauvegardés. Seul un enregistrement explicite d’un contenu textuel l’envoie à votre bibliothèque Supabase. Si vous choisissez de conserver un brouillon avant connexion, il est temporairement placé dans le stockage de session de cet onglet, puis retiré après restauration. Les images externes d’un document Markdown ne sont contactées qu’après votre clic sur leur bouton de chargement.",
          )}
        </p>
        <ul>
          <li>
            <strong>{t("Compte :")}</strong>{" "}
            {t(
              "adresse email, identifiant de compte, méthode d’authentification, état de confirmation de l’email, dates d’inscription et de dernière connexion. Avec une inscription par email, le mot de passe est géré sous une forme protégée par le service d’authentification ; il n’est pas affiché dans l’administration de Pastly.",
            )}
          </li>
          <li>
            <strong>{t("Profil :")}</strong>{" "}
            {t(
              "pseudonyme, nom affiché, photo de profil facultative et date d’inscription. La photo choisie est recadrée et réencodée sans métadonnées EXIF, puis hébergée dans Supabase Storage. Vous pouvez utiliser un pseudonyme ; votre nom civil n’est pas nécessaire pour publier des notes.",
            )}
          </li>
          <li>
            <strong>{t("Contenus enregistrés :")}</strong>{" "}
            {t(
              "titre, contenu source, format, nom du fichier d’origine lorsqu’il est fourni, couleur, visibilité publique ou privée, propriétaire, dates de création et de modification.",
            )}
          </li>
          <li>
            <strong>{t("Fonctionnement et sécurité :")}</strong>{" "}
            {t(
              "cookies de session, informations de connexion, adresse IP et données techniques susceptibles de figurer dans les journaux des prestataires, ainsi que les changements de rôles administrateurs.",
            )}
          </li>
          <li>
            <strong>{t("Mesures d’usage et de performance :")}</strong>{" "}
            {t(
              "pages consultées, provenance de la visite, informations générales sur le navigateur, l’appareil et la localisation approximative, ainsi que temps de chargement et indicateurs de performance, lorsque les services Vercel correspondants sont actifs.",
            )}
          </li>
          <li>
            <strong>{t("Contact :")}</strong>{" "}
            {t(
              "votre adresse de correspondance et les informations que vous nous transmettez dans une demande ou un signalement.",
            )}
          </li>
        </ul>
        <p>
          {t(
            "Les informations de compte nécessaires à l’authentification sont obligatoires pour créer un compte. Sans elles, vous pouvez toujours consulter les espaces publics. Le contenu des notes et le choix de la connexion Google sont facultatifs. Ne placez pas dans vos notes des données sensibles ou des informations concernant un tiers que vous n’êtes pas autorisé à communiquer.",
          )}
        </p>
      </section>
      <section>
        <h2>{t("3. Si vous choisissez de vous connecter avec Google")}</h2>
        <p>
          {t(
            "Google transmet à notre service d’authentification Supabase les informations d’identité nécessaires à la connexion : identifiant Google, adresse email et son état de vérification, ainsi que des informations de profil de base pouvant inclure le nom et la photo. Ces informations peuvent être conservées dans les données d’identité du compte par Supabase. Le profil public Pastly reste distinct et personnalisable.",
          )}
        </p>
        <p>
          {t(
            "Pastly ne reçoit pas votre mot de passe Google. Les autorisations demandées se limitent à l’identité de base, à l’email et au profil. Nous ne demandons aucun accès à Gmail, Drive, Calendar ou à vos contacts. Les données obtenues de Google servent à vous identifier, à créer ou retrouver votre compte et à sécuriser votre connexion ; elles ne sont ni vendues ni utilisées pour la publicité.",
          )}
        </p>
        <p>
          {t("Vous pouvez gérer les accès depuis les")}{" "}
          <a href="https://myaccount.google.com/connections" rel="noreferrer">
            {t("connexions de votre compte Google")}
          </a>
          {t(
            ". Retirer cet accès ne supprime pas automatiquement votre compte Pastly ou vos notes : vous pouvez nous en demander la suppression. Les traitements effectués par Google pour son propre service sont décrits dans sa",
          )}{" "}
          <a href="https://policies.google.com/privacy" rel="noreferrer">
            {t("politique de confidentialité")}
          </a>
          .
        </p>
      </section>
      <section>
        <h2>{t("4. Pourquoi utilisons-nous ces données ?")}</h2>
        <dl>
          <dt>{t("Fournir votre compte, votre profil et vos notes")}</dt>
          <dd>
            {t(
              "Création et gestion du compte, connexion, récupération de l’accès, enregistrement et affichage des notes selon leur visibilité. Ces traitements sont nécessaires à l’exécution du service demandé et des",
            )}{" "}
            <Link href="/terms">{t("conditions d’utilisation")}</Link>{" "}
            {t("(article 6, paragraphe 1, b du RGPD).")}
          </dd>
          <dt>{t("Sécuriser et administrer le service")}</dt>
          <dd>
            {t(
              "Prévention des accès non autorisés, diagnostic des incidents, contrôle des habilitations et traitement des abus. Ils reposent sur notre intérêt légitime à protéger le service et ses utilisateurs (article 6, paragraphe 1, f du RGPD).",
            )}
          </dd>
          <dt>{t("Comprendre l’usage et améliorer les performances")}</dt>
          <dd>
            {t(
              "Les mesures Vercel servent à comprendre la fréquentation et les problèmes de chargement. Elles répondent à notre intérêt légitime à améliorer le service, dans la limite des règles applicables aux traceurs et à la protection des données. Elles ne servent pas à cibler des publicités.",
            )}
          </dd>
          <dt>{t("Répondre aux demandes et respecter la loi")}</dt>
          <dd>
            {t(
              "Le traitement des demandes courantes relève de la fourniture du service ou de notre intérêt légitime à y répondre. Les demandes d’exercice de droits, les réquisitions et les conservations légalement imposées reposent sur les obligations applicables (article 6, paragraphe 1, c du RGPD).",
            )}
          </dd>
        </dl>
        <p>
          {t(
            "Pastly ne prend pas de décision produisant des effets juridiques à votre égard sur la seule base d’un traitement automatisé et ne réalise pas de profilage publicitaire.",
          )}
        </p>
      </section>
      <section>
        <h2>{t("5. Ce qui est public et ce qui reste privé")}</h2>
        <p>
          <strong>{t("Un nouveau contenu est privé par défaut.")}</strong>{" "}
          {t(
            "Si vous le rendez public, son contenu, votre pseudonyme, votre nom affiché et les informations publiques de votre profil sont alors accessibles aux visiteurs sans compte. Ils peuvent être copiés ou partagés par des tiers. Votre adresse email n’est pas affichée sur le profil public.",
          )}
        </p>
        <p>
          {t(
            "Votre photo de profil est publique, y compris lorsque vos notes sont privées. Vous pouvez la remplacer ou la supprimer depuis votre profil.",
          )}
        </p>
        <p>
          {t(
            "Vous pouvez choisir la visibilité avant l’enregistrement ou la modifier ensuite. Les autres utilisateurs ne peuvent pas consulter vos notes privées dans Pastly, même s’ils disposent du lien. Les personnes habilitées à exploiter l’infrastructure peuvent toutefois devoir accéder aux données pour une intervention nécessaire, la sécurité ou une obligation légale. Les notes ne sont pas chiffrées de bout en bout.",
          )}
        </p>
        <p>
          {t(
            "L’administration du site permet de superviser les comptes, leurs emails, les dates de connexion, les rôles et les nombres de notes publiques et privées. Elle n’affiche pas le texte des notes privées. Rendre une note privée ou la supprimer n’efface pas les copies déjà faites par des tiers.",
          )}
        </p>
      </section>
      <section>
        <h2>{t("6. Prestataires et destinataires")}</h2>
        <p>
          {t(
            "L’accès aux données est limité aux personnes habilitées et aux prestataires nécessaires à leurs missions :",
          )}
        </p>
        <ul>
          <li>
            <strong>{t("Supabase :")}</strong>{" "}
            {t(
              "hébergement de la base, authentification et gestion des sessions, stockage et diffusion des photos de profil.",
            )}
          </li>
          <li>
            <strong>{t("Vercel :")}</strong>{" "}
            {t(
              "hébergement de l’application, diffusion du site, journaux techniques et, lorsqu’ils sont actifs, Web Analytics et Speed Insights.",
            )}
          </li>
          <li>
            <strong>{t("Google :")}</strong>{" "}
            {t("authentification si vous choisissez cette méthode.")}
          </li>
          <li>
            <strong>{t("Prestataires de messagerie :")}</strong>{" "}
            {t(
              "acheminement des confirmations d’inscription, des liens de récupération et des réponses à vos demandes.",
            )}
          </li>
          <li>
            <strong>{t("Prestataires du domaine et du réseau :")}</strong>{" "}
            {t(
              "notamment Cloudflare pour la résolution DNS ; un traitement des données de trafic dépend des services effectivement utilisés.",
            )}
          </li>
        </ul>
        <p>
          {t(
            "Les autorités compétentes peuvent recevoir les informations exigées par la loi. Nous ne vendons pas vos données personnelles.",
          )}
        </p>
        <p>
          {t(
            "Ces prestataires peuvent traiter certaines données en dehors de l’Espace économique européen, selon les régions d’hébergement et leurs sous-traitants. Les mécanismes de protection applicables figurent dans leurs accords de traitement des données, notamment les clauses contractuelles types de la Commission européenne lorsqu’elles sont nécessaires. Vous pouvez nous demander des précisions sur les lieux de traitement et les garanties applicables.",
          )}
        </p>
      </section>
      <section>
        <h2>{t("7. Cookies et mesures de fréquentation")}</h2>
        <p>
          {t(
            "La langue de l’interface est choisie selon les préférences de votre navigateur. Si vous changez de langue dans le sélecteur, un cookie de préférence conserve ce choix pendant un an. Vous pouvez supprimer ce cookie pour réutiliser la langue du navigateur.",
          )}
        </p>
        <p>
          {t(
            "Des cookies techniques permettent de conserver votre session et de sécuriser les parcours de connexion ou de récupération. Ils sont nécessaires aux fonctionnalités d’authentification que vous demandez. Vous pouvez les supprimer ou les bloquer dans votre navigateur, mais la connexion et la persistance de session peuvent alors ne plus fonctionner.",
          )}
        </p>
        <p>
          {t(
            "Les cookies d’authentification peuvent avoir une durée de vie allant jusqu’à 400 jours, renouvelée lors de leur réécriture. La validité effective de la session dépend aussi des contrôles du service d’authentification ; la déconnexion supprime les cookies de session du navigateur concerné.",
          )}
        </p>
        <p>
          {t(
            "Lorsque Web Analytics et Speed Insights sont actifs, Vercel reçoit des mesures de navigation et de performance, incluant les adresses des pages et certaines informations techniques. Pastly retire les paramètres de recherche et les fragments des événements envoyés par ces composants, et exclut les événements des pages d’administration, de bibliothèque, de document et des pages sensibles d’authentification. Cela ne modifie pas les journaux techniques des prestataires décrits dans cette politique.",
          )}
        </p>
        <p>
          {t(
            "Vercel présente ces outils comme des mesures agrégées et indique que Web Analytics ne recourt pas à des cookies tiers ; son identifiant technique de visite est supprimé après 24 heures. Cette durée ne correspond pas à la conservation de toutes les statistiques. Pour en savoir plus :",
          )}{" "}
          <a
            href="https://vercel.com/docs/analytics/privacy-policy"
            rel="noreferrer"
          >
            {t("confidentialité de Web Analytics")}
          </a>{" "}
          {t("et")}{" "}
          <a
            href="https://vercel.com/docs/speed-insights/privacy-policy"
            rel="noreferrer"
          >
            {t("confidentialité de Speed Insights")}
          </a>
          .
        </p>
      </section>
      <section>
        <h2>{t("8. Durées de conservation")}</h2>
        <ul>
          <li>
            <strong>{t("Compte et profil :")}</strong>{" "}
            {t(
              "pendant l’ouverture du compte, jusqu’à sa fermeture et au traitement de la demande d’effacement. Aucune suppression automatique pour inactivité n’est actuellement mise en œuvre.",
            )}
          </li>
          <li>
            <strong>{t("Photo de profil :")}</strong>{" "}
            {t(
              "jusqu’à son remplacement, sa suppression depuis le profil ou la fermeture du compte. Des copies peuvent subsister temporairement dans les caches et sauvegardes des prestataires ou avoir été enregistrées par des tiers.",
            )}
          </li>
          <li>
            <strong>{t("Notes :")}</strong>{" "}
            {t(
              "jusqu’à leur suppression par vous-même ou à l’effacement du compte, sous réserve d’une conservation légalement nécessaire. La suppression retire la note de la base utilisée par le site.",
            )}
          </li>
          <li>
            <strong>{t("Demandes et signalements :")}</strong>{" "}
            {t(
              "pendant leur traitement, puis uniquement pour la durée nécessaire au suivi et à la preuve de leur résolution, selon la nature de la demande et les délais légaux applicables.",
            )}
          </li>
          <li>
            <strong>
              {t("Journaux, historique des habilitations et statistiques :")}
            </strong>{" "}
            {t(
              "selon la durée nécessaire au diagnostic, à la sécurité et à l’analyse, les paramètres des prestataires et les éventuelles obligations de conservation. Les informations conservées pour un incident ou un litige sont limitées à ce qui est nécessaire jusqu’à sa résolution ou à l’expiration du délai légal concerné.",
            )}
          </li>
          <li>
            <strong>{t("Sauvegardes :")}</strong>{" "}
            {t(
              "des copies peuvent subsister jusqu’à leur remplacement ou expiration selon le cycle de sauvegarde du prestataire. Elles ne sont pas destinées à la consultation courante ; la suppression de la base active ne signifie donc pas l’effacement immédiat de toute sauvegarde.",
            )}
          </li>
        </ul>
        <p>
          {t(
            "Vous pouvez demander à l’éditeur des précisions sur les durées et paramètres applicables à vos données.",
          )}
        </p>
      </section>
      <section>
        <h2>{t("9. Vos droits et comment les exercer")}</h2>
        <p>
          {t(
            "Selon les conditions du RGPD, vous pouvez demander l’accès à vos données, leur rectification, leur effacement, la limitation du traitement et la portabilité des données concernées. Vous pouvez vous opposer aux traitements fondés sur l’intérêt légitime pour des raisons tenant à votre situation. Lorsqu’un traitement repose sur votre consentement, vous pouvez le retirer pour l’avenir. Vous pouvez également donner les directives prévues par le droit français concernant vos données après votre décès.",
          )}
        </p>
        <p>
          {t(
            "Vous pouvez déjà modifier votre profil et gérer ou supprimer vos notes depuis votre compte. Pour les autres demandes, notamment l’accès à une copie de vos données ou la suppression de votre compte, écrivez à",
          )}{" "}
          <a href={`mailto:${legal.email}`}>{legal.email}</a>
          {t(
            ", de préférence depuis l’adresse liée au compte. Il n’existe pas encore de bouton de fermeture de compte dans l’application.",
          )}
        </p>
        <p>
          {t(
            "Nous vérifions votre identité de façon proportionnée si nécessaire et répondons en principe dans un délai d’un mois. En cas de demande complexe ou de demandes nombreuses, ce délai peut être prolongé de deux mois ; vous êtes alors informé des motifs dans le premier mois.",
          )}
        </p>
        <p>
          {t("Vous pouvez aussi introduire une réclamation auprès de la")}{" "}
          <a href="https://www.cnil.fr/fr/plaintes" rel="noreferrer">
            CNIL
          </a>{" "}
          {t("ou de l’autorité de contrôle compétente pour votre situation.")}
        </p>
      </section>
      <section>
        <h2>{t("10. Sécurité et mises à jour")}</h2>
        <p>
          {t(
            "Pastly met en œuvre des contrôles d’accès aux notes, des sessions d’authentification et des restrictions d’administration. Aucun service en ligne ne peut garantir une sécurité absolue. Utilisez un mot de passe unique lorsque vous choisissez cette méthode et protégez aussi votre compte Google si vous l’utilisez.",
          )}
        </p>
        <p>
          {t(
            "Cette politique est mise à jour en cas d’évolution du service ou des traitements. Sa date figure en haut de page. Les changements importants sont portés à votre connaissance par un moyen adapté.",
          )}
        </p>
      </section>
    </LegalPage>
  );
}
