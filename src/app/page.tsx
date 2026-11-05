import Link from "next/link";
import { ViewerWorkspace } from "@/components/viewer/viewer-workspace";
import { getUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ draft?: string }>;
}) {
  const user = await getUser();
  const params = await searchParams;
  return (
    <div className="container viewer-home">
      <header className="viewer-heading">
        <span className="eyebrow">
          COLLEZ. VISUALISEZ. CONSERVEZ. PARTAGEZ.
        </span>
        <h1>Collez quelque chose.</h1>
        <p>Pastly s’occupe de le rendre lisible.</p>
      </header>
      <ViewerWorkspace
        authenticated={!!user}
        configured={isSupabaseConfigured()}
        resumeDraft={params.draft === "1"}
      />
      <section className="viewer-intro" aria-label="À propos du visualiseur">
        <div>
          <h2>De la source à l’essentiel.</h2>
          <p>
            Documents Markdown, arbres JSON, diagrammes Mermaid, code et
            tableaux. Choisissez un format ou laissez Pastly le détecter.
          </p>
        </div>
        <div>
          <h2>À portée de main.</h2>
          <p>
            La visualisation fonctionne sans compte. Connectez-vous pour
            conserver vos contenus, privés par défaut, et partager ceux que vous
            rendez publics.
          </p>
        </div>
        <div>
          <h2>Toujours une place pour vos idées.</h2>
          <p>Les post-it colorés sont toujours là.</p>
          <Link href="/notes/new">Créer un post-it →</Link>
          <br />
          <Link href="/explore">Explorer les contenus publics →</Link>
        </div>
      </section>
      <noscript>
        Le visualiseur local nécessite JavaScript. Les contenus classiques et
        les pages légales restent consultables.
      </noscript>
    </div>
  );
}
