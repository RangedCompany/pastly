"use client";
import { useTranslations } from "@/components/i18n";
import Link from "next/link";
import { ArrowRight, Search, StickyNote } from "lucide-react";
import type { ActionState } from "@/lib/validation";
import { FORMATS, FORMAT_LABELS } from "@/lib/viewer/types";
export { UserAvatar } from "./user-avatar";
export function EmptyState({
  title = "Un peu de place pour de nouvelles idées.",
  description = "Aucune note ici pour le moment.",
  href,
  label = "Créer une note",
}: {
  title?: string;
  description?: string;
  href?: string;
  label?: string;
}) {
  const t = useTranslations();
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <StickyNote size={30} strokeWidth={1.5} />
      </span>
      <h2>{t(title)}</h2>
      <p>{t(description)}</p>
      {href && (
        <Link href={href} className="button button-primary">
          {t(label)}
          <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}
export function LoadingState() {
  const t = useTranslations();
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">{t("Chargement des notes…")}</span>
      <div className="note-grid" aria-hidden="true">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="note-skeleton" />
        ))}
      </div>
    </div>
  );
}
export function FormMessage({ state }: { state: ActionState }) {
  const t = useTranslations();
  return (
    <>
      {state.error && (
        <p className="message message-error" role="alert">
          {t(state.error)}
        </p>
      )}
      {state.success && (
        <p className="message message-success" role="status">
          {t(state.success)}
        </p>
      )}
    </>
  );
}
export function SetupNotice() {
  const t = useTranslations();
  return (
    <div className="setup-notice" role="status">
      <strong>{t("Votre atelier est presque prêt.")}</strong>
      <p>
        {t(
          "Connectez le projet à Supabase pour activer les comptes et afficher les contenus. Les étapes sont détaillées dans le README.",
        )}
      </p>
    </div>
  );
}
export function SearchBar({
  query,
  placeholder = "Rechercher une idée, un mot…",
  visibility,
  format = "all",
}: {
  query: string;
  placeholder?: string;
  visibility?: string;
  format?: string;
}) {
  const t = useTranslations();
  return (
    <form className="search-form" role="search">
      <div className="search-input">
        <Search size={18} aria-hidden="true" />
        <label className="sr-only" htmlFor="search">
          {t("Rechercher des contenus")}
        </label>
        <input
          id="search"
          type="search"
          name="q"
          defaultValue={query}
          maxLength={100}
          placeholder={t(placeholder)}
        />
      </div>
      {visibility !== undefined && (
        <>
          <label htmlFor="visibility" className="sr-only">
            {t("Visibilité")}
          </label>
          <select id="visibility" name="visibility" defaultValue={visibility}>
            <option value="all">{t("Toutes les visibilités")}</option>
            <option value="public">{t("Publics")}</option>
            <option value="private">{t("Privés")}</option>
          </select>
        </>
      )}
      <label htmlFor="format-filter" className="sr-only">
        {t("Filtrer par format")}
      </label>
      <select id="format-filter" name="format" defaultValue={format}>
        <option value="all">{t("Tous les formats")}</option>
        {FORMATS.map((value) => (
          <option key={value} value={value}>
            {t(FORMAT_LABELS[value])}
          </option>
        ))}
      </select>
      <button className="button button-secondary" type="submit">
        {t("Rechercher")}
      </button>
    </form>
  );
}
export function Pagination({
  page,
  count,
  base,
  query = "",
  visibility,
  format,
}: {
  page: number;
  count: number;
  base: string;
  query?: string;
  visibility?: string;
  format?: string;
}) {
  const t = useTranslations();
  const pages = Math.max(1, Math.ceil(count / 12));
  function href(n: number) {
    const p = new URLSearchParams({ page: String(n) });
    if (query) p.set("q", query);
    if (visibility) p.set("visibility", visibility);
    if (format && format !== "all") p.set("format", format);
    return `${base}?${p}`;
  }
  if (pages <= 1 && page === 1) return null;
  return (
    <nav aria-label={t("Pagination des contenus")} className="pagination">
      {page > 1 ? (
        <Link className="button button-secondary" href={href(page - 1)}>
          {t("Précédent")}
        </Link>
      ) : (
        <span />
      )}
      <span>
        {t("Page {page} · {items}", {
          page: page.toLocaleString(t.locale),
          items: t.plural("{count} contenu", "{count} contenus", count),
        })}
      </span>
      {page < pages ? (
        <Link className="button button-secondary" href={href(page + 1)}>
          {t("Suivant")}
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
