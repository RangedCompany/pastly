import { ViewerWorkspace } from "@/components/viewer/viewer-workspace";
import { getIdentity } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ draft?: string }>;
}) {
  const user = await getIdentity();
  const params = await searchParams;
  return (
    <div className="container viewer-home">
      <h1 className="sr-only">Éditeur Pastly</h1>
      <ViewerWorkspace
        authenticated={!!user}
        configured={isSupabaseConfigured()}
        resumeDraft={params.draft === "1"}
      />
      <noscript>
        Le visualiseur local nécessite JavaScript. Les contenus classiques et
        les pages légales restent consultables.
      </noscript>
    </div>
  );
}
