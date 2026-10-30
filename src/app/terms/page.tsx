import type { Metadata } from "next";
import Link from "next/link";
import { LegalContact, LegalPage } from "@/components/legal-page";
import { legal } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Conditions générales d’utilisation",
  description:
    "Les conditions d’utilisation de Pastly : comptes, notes publiques et privées, droits sur les contenus et contact.",
  alternates: { canonical: "/terms" },
};

export default function Terms() {
  return (
    <LegalPage
      title="Conditions générales d’utilisation"
      description="Les règles pour partager vos idées et utiliser Pastly dans le respect de chacun."
    >
      <section>
        <h2>1. Le service et son éditeur</h2>
        <p>
          Pastly, accessible sur pastly.fr, est un service gratuit permettant de
          créer, modifier et partager des notes sous forme de post-it. Vous
          pouvez consulter les publications publiques sans compte. Un compte est
          nécessaire pour créer des notes et gérer votre profil.
        </p>
        <p>
          Le service est édité par {legal.publisher}. Pour une question, une
          demande ou un signalement :
        </p>
        <LegalContact />
      </section>
      <section>
        <h2>2. Création et sécurité du compte</h2>
        <p>
          Vous pouvez vous inscrire avec une adresse email et un mot de passe
          ou, lorsque cette option est disponible, avec votre compte Google. La
          confirmation de votre email peut être nécessaire. Vous devez disposer
          du droit d’utiliser l’adresse et le compte choisis, ne pas usurper
          l’identité d’un tiers et maintenir vos informations à jour.
        </p>
        <p>
          En créant un compte, vous acceptez les présentes conditions. Si vous
          êtes mineur, vous devez disposer de l’autorisation de votre
          représentant légal lorsque celle-ci est nécessaire. La{" "}
          <Link href="/privacy">politique de confidentialité</Link> explique
          séparément l’utilisation de vos données.
        </p>
        <p>
          Conservez vos identifiants confidentiels et déconnectez-vous des
          appareils partagés. Signalez toute utilisation non autorisée de votre
          compte à l’éditeur. Pastly ne vous demande jamais de transmettre votre
          mot de passe par email.
        </p>
      </section>
      <section>
        <h2>3. Notes publiques, notes privées et profil</h2>
        <p>
          <strong>Les nouvelles notes sont publiques par défaut.</strong>{" "}
          Vérifiez leur visibilité avant de les enregistrer. Une note publique
          est accessible à toute personne, sans connexion, dans les espaces
          publics du site ou par son lien. Elle peut être copiée, partagée ou
          consultée par des moteurs de recherche.
        </p>
        <p>
          Une note privée est réservée à votre compte dans l’interface et ne
          devient pas publique par le simple partage de son lien. Ce réglage ne
          constitue pas un chiffrement de bout en bout : des accès techniques
          strictement nécessaires à la maintenance, à la sécurité ou au respect
          d’une obligation légale restent possibles pour les personnes
          habilitées.
        </p>
        <p>
          Votre pseudonyme, votre nom affiché, votre date d’inscription et vos
          notes publiques apparaissent sur votre profil public. Votre adresse
          email n’y est pas affichée.
        </p>
        <p>
          Vous pouvez modifier, supprimer ou changer la visibilité de vos notes.
          Le passage en privé ou la suppression bloque les nouvelles
          consultations publiques sur Pastly après prise en compte de la
          modification. Il n’efface pas une copie déjà réalisée, une page encore
          ouverte ou le cache d’un service extérieur. Évitez de publier des
          informations sensibles, des secrets ou des données concernant d’autres
          personnes.
        </p>
      </section>
      <section>
        <h2>4. Utilisations autorisées et contenus interdits</h2>
        <p>
          Vous êtes responsable des contenus que vous publiez et devez disposer
          des droits nécessaires. Vous vous engagez à respecter la loi, la vie
          privée et les droits des autres personnes.
        </p>
        <ul>
          <li>
            Ne publiez pas de contenus illicites, menaçants, harcelants,
            discriminatoires, diffamatoires ou portant atteinte aux droits de
            propriété intellectuelle.
          </li>
          <li>
            Ne divulguez pas de données personnelles de tiers sans droit ni de
            documents confidentiels.
          </li>
          <li>
            N’utilisez pas le service pour diffuser du spam, des escroqueries,
            des liens malveillants ou des contenus destinés à tromper les
            utilisateurs.
          </li>
          <li>
            Ne tentez pas d’accéder aux comptes ou notes privées d’autrui, de
            contourner les protections du service ou de perturber son
            fonctionnement.
          </li>
        </ul>
        <p>
          Les ressources techniques étant partagées, l’usage doit rester
          raisonnable. Des limites techniques peuvent s’appliquer pour protéger
          la disponibilité du service.
        </p>
      </section>
      <section>
        <h2>5. Vos droits sur vos contenus</h2>
        <p>
          Vous conservez vos droits sur vos notes. Vous accordez à l’éditeur une
          autorisation non exclusive, limitée à la fourniture du service, pour
          héberger, sauvegarder, reproduire et afficher ces contenus selon leur
          visibilité. Cette autorisation permet aussi leur transmission aux
          prestataires techniques nécessaires au fonctionnement de Pastly.
        </p>
        <p>
          Elle prend fin lorsque le contenu est supprimé du service, sous
          réserve de la rotation des sauvegardes et des conservations légalement
          nécessaires. La publication d’une note ne transfère pas vos droits
          d’auteur et n’autorise pas les autres utilisateurs à la réutiliser en
          dehors des droits prévus par la loi ou d’une autorisation de votre
          part.
        </p>
      </section>
      <section>
        <h2>6. Signalements et protection du service</h2>
        <p>
          Pour signaler un contenu ou un comportement, écrivez à{" "}
          <a href={`mailto:${legal.email}`}>{legal.email}</a> en indiquant le
          lien concerné, le motif et les éléments utiles, sans transmettre de
          mot de passe.
        </p>
        <p>
          L’éditeur examine les signalements et peut prendre les mesures
          nécessaires et proportionnées, notamment retirer un contenu ou
          restreindre un compte, en cas de violation des présentes conditions,
          de risque pour la sécurité ou d’obligation légale. Sauf urgence ou
          interdiction légale, l’utilisateur concerné est informé des motifs et
          peut demander un réexamen par email.
        </p>
      </section>
      <section>
        <h2>7. Disponibilité et responsabilité</h2>
        <p>
          Pastly peut évoluer ou être temporairement interrompu pour
          maintenance, incident ou raisons de sécurité. L’éditeur met en œuvre
          des moyens raisonnables pour assurer son fonctionnement, sans
          promettre une disponibilité permanente ni l’absence totale d’erreurs.
          Conservez une copie des informations qui vous sont indispensables.
        </p>
        <p>
          Les contenus publiés par les utilisateurs expriment leurs propres
          opinions. Les liens vers des services extérieurs relèvent de leurs
          éditeurs respectifs. La responsabilité de chaque partie est appréciée
          selon le droit applicable ; aucune disposition ne limite les droits ou
          responsabilités auxquels la loi interdit de déroger.
        </p>
      </section>
      <section>
        <h2>8. Fermeture du compte et données personnelles</h2>
        <p>
          Vous pouvez supprimer vos notes depuis votre espace. Pour demander la
          fermeture de votre compte et l’effacement de ses données, contactez{" "}
          <a href={`mailto:${legal.email}`}>{legal.email}</a>, de préférence
          depuis l’adresse associée au compte. La fermeture n’est pas encore
          proposée par un bouton dans l’application.
        </p>
        <p>
          Une vérification proportionnée de votre identité peut être nécessaire.
          La <Link href="/privacy">politique de confidentialité</Link> détaille
          les droits, les conditions de suppression et les éventuelles
          conservations imposées ou autorisées par la loi.
        </p>
      </section>
      <section>
        <h2>9. Évolution des conditions et droit applicable</h2>
        <p>
          La version applicable est celle publiée sur cette page, avec sa date
          de mise à jour. Toute modification importante est portée à la
          connaissance des utilisateurs par un moyen adapté avant son
          application, sauf exigence légale ou de sécurité nécessitant une prise
          d’effet immédiate.
        </p>
        <p>
          Les présentes conditions sont régies par le droit français, sous
          réserve des protections impératives applicables à votre situation. En
          cas de difficulté, contactez d’abord l’éditeur afin de rechercher une
          solution amiable. À défaut, les juridictions compétentes sont
          déterminées par les règles légales applicables.
        </p>
      </section>
    </LegalPage>
  );
}
