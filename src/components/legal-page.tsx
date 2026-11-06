import { getTranslations } from "@/lib/i18n/server";
import Link from "next/link";
import { legal } from "@/lib/legal";
import { formatDate } from "@/lib/date";

export function LegalContact() {
  return (
    <address>
      {legal.publisher}
      <br />
      {legal.address}
      <br />
      <a href={`mailto:${legal.email}`}>{legal.email}</a>
    </address>
  );
}

export async function LegalPage({
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
    <article className="legal-page">
      <header className="page-heading">
        <span className="eyebrow">{t("PASTLY, EN TOUTE TRANSPARENCE")}</span>
        <h1>{t(title)}</h1>
        <p>{t(description)}</p>
        <p className="legal-updated">
          {t("Mise à jour le")}{" "}
          <time dateTime={legal.updatedAtIso}>
            {formatDate(legal.updatedAtIso, true, t.locale)}
          </time>
        </p>
      </header>
      <nav className="legal-navigation" aria-label={t("Informations légales")}>
        <Link href="/terms">{t("Conditions d’utilisation")}</Link>
        <Link href="/privacy">{t("Politique de confidentialité")}</Link>
      </nav>
      <div className="legal-content">{children}</div>
    </article>
  );
}
