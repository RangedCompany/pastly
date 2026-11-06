"use client";
import { useTranslations } from "@/components/i18n";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations();
  return (
    <div className="error-page">
      <span className="eyebrow">{t("PETIT CONTRETEMPS")}</span>
      <h1>{t("Une idée s’est égarée.")}</h1>
      <p>
        {t(
          "Nous n’avons pas pu charger cette page. Vérifiez votre connexion et réessayez dans un instant.",
        )}
      </p>
      <button className="button button-primary" onClick={reset}>
        {t("Réessayer")}
      </button>
    </div>
  );
}
