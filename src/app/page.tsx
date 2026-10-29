import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Feather,
  Globe2,
  LockKeyhole,
  Sparkles,
  Sprout,
} from "lucide-react";

export default function Home() {
  return (
    <div className="container">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">UN PETIT COIN POUR VOS IDÉES</span>
          <h1>
            Une idée.
            <br />
            Un post-it.
            <br />
            <em>Et ça prend vie.</em>
          </h1>
          <p>
            Les pensées qui passent, les mots qui restent. Créez des post-it
            colorés, partagez vos inspirations ou gardez-les pour vous.
          </p>
          <div className="hero-actions">
            <Link href="/explore" className="button button-primary">
              Explorer les post-it
              <ArrowUpRight size={17} />
            </Link>
            <Link href="/notes/new" className="button button-secondary">
              Créer mon premier post-it
              <ArrowRight size={16} />
            </Link>
          </div>
          <span className="hero-footnote">
            <Check size={13} />
            Gratuit. Simple. Un peu comme du papier.
          </span>
        </div>
        <div className="hero-art" aria-label="Exemples illustratifs de post-it">
          <div className="demo-note paper-yellow">
            <span className="tape" />
            <h3>
              Les bonnes idées
              <br />
              commencent ici.
            </h3>
            <p>
              Même celles griffonnées
              <br />
              sur un coin de table.
            </p>
            <Sparkles size={21} className="demo-mark" />
          </div>
          <div className="demo-note paper-green">
            <h3>
              À essayer
              <br />
              cette semaine
            </h3>
            <p>
              ☐ Prendre un autre chemin
              <br />☐ Apprendre quelque chose
              <br />☐ Ne rien prévoir, aussi
            </p>
          </div>
          <div className="demo-note paper-pink">
            <h3>Petit rappel</h3>
            <p>
              Pas besoin d’avoir tout prévu
              <br />
              pour faire le premier pas.
            </p>
            <Sprout size={24} className="demo-mark" />
          </div>
          <div className="demo-note paper-blue">
            <h3>Et si…</h3>
            <p>
              On faisait un peu plus
              <br />
              de place à nos idées ?
            </p>
            <span className="demo-mark">↗</span>
          </div>
          <span className="art-caption">
            Quelques exemples, en attendant vos mots.
          </span>
        </div>
      </section>
      <section
        className="intro-strip section-divider"
        aria-label="Comment fonctionne Pastly"
      >
        <div className="intro-item">
          <span>
            <Feather size={18} />
          </span>
          <div>
            <h2>Attrapez l’idée au vol</h2>
            <p>
              Un titre, quelques mots, une couleur. C’est tout ce qu’il faut
              pour commencer.
            </p>
          </div>
        </div>
        <div className="intro-item">
          <span>
            <Globe2 size={18} />
          </span>
          <div>
            <h2>Ouvrez une fenêtre</h2>
            <p>
              Vos post-it publics se découvrent dans Explorer et se partagent
              avec un simple lien.
            </p>
          </div>
        </div>
        <div className="intro-item">
          <span>
            <LockKeyhole size={18} />
          </span>
          <div>
            <h2>Ou gardez votre jardin secret</h2>
            <p>
              Un clic pour passer en privé. Vos mots restent alors rien que pour
              vous.
            </p>
          </div>
        </div>
      </section>
      <section className="home-bottom">
        <div>
          <h2>Il suffit parfois d’une petite note.</h2>
          <p>
            Découvrez les idées partagées par la communauté, sans avoir besoin
            de compte.
          </p>
        </div>
        <Link href="/explore" className="button button-secondary">
          Faire un tour dans Explorer
          <ArrowRight size={17} />
        </Link>
      </section>
    </div>
  );
}
