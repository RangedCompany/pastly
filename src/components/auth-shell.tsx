import { getTranslations } from "@/lib/i18n/server";
import { Sprout } from "lucide-react";
export async function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const t = await getTranslations();
  return (
    <div className="auth-layout">
      <aside className="auth-story" aria-hidden="true">
        <span className="eyebrow">{t("BIENVENUE DANS VOTRE ATELIER")}</span>
        <h2>
          {t("Faites une place")}
          <br />
          {t("à vos idées.")}
        </h2>
        <div className="demo-note paper-yellow">
          <span className="tape" />
          <h3>{t("Note à moi-même")}</h3>
          <p>
            {t("Les petites choses peuvent")}
            <br />
            {t("être de grands débuts.")}
          </p>
          <Sprout size={24} className="demo-mark" />
        </div>
        <p>{t("Un peu de papier. Beaucoup de possibilités.")}</p>
      </aside>
      <section className="auth-panel">
        <span className="eyebrow">{t("PASTLY, TOUT SIMPLEMENT")}</span>
        <h1>{t(title)}</h1>
        <p>{t(description)}</p>
        {children}
      </section>
    </div>
  );
}
