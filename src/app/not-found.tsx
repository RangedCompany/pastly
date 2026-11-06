import { getTranslations } from "@/lib/i18n/server";
import Link from "next/link";
export default async function NotFound() {
  const t = await getTranslations();
  return (
    <div className="error-page">
      <span className="eyebrow">{t("404 · RIEN À CET ENDROIT")}</span>
      <h1>{t("Ce petit coin est vide.")}</h1>
      <p>
        {t(
          "Cette page n’existe pas ou n’est pas accessible. D’autres idées vous attendent dans Explorer.",
        )}
      </p>
      <Link href="/explore" className="button button-primary">
        {t("Retourner dans Explorer")}
      </Link>
    </div>
  );
}
