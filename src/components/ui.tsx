import Link from "next/link";
import { ArrowRight, Search, StickyNote } from "lucide-react";
import type { ActionState } from "@/lib/validation";

export function UserAvatar({
  name,
  small = false,
}: {
  name: string;
  small?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={`avatar ${small ? "avatar-small" : ""}`}
    >
      {name.trim().slice(0, 2).toUpperCase()}
    </span>
  );
}
export function EmptyState({
  title = "Un peu de place pour de nouvelles idées.",
  description = "Aucun post-it ici pour le moment.",
  href,
  label = "Créer un post-it",
}: {
  title?: string;
  description?: string;
  href?: string;
  label?: string;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <StickyNote size={30} strokeWidth={1.5} />
      </span>
      <h2>{title}</h2>
      <p>{description}</p>
      {href && (
        <Link href={href} className="button button-primary">
          {label}
          <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}
export function LoadingState() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Chargement des post-it…</span>
      <div className="note-grid" aria-hidden="true">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="note-skeleton" />
        ))}
      </div>
    </div>
  );
}
export function FormMessage({ state }: { state: ActionState }) {
  return (
    <>
      {state.error && (
        <p className="message message-error" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="message message-success" role="status">
          {state.success}
        </p>
      )}
    </>
  );
}
export function SetupNotice() {
  return (
    <div className="setup-notice" role="status">
      <strong>Votre atelier est presque prêt.</strong>
      <p>
        Connectez le projet à Supabase pour activer les comptes et afficher les
        vrais post-it. Les étapes sont détaillées dans le README.
      </p>
    </div>
  );
}
export function SearchBar({
  query,
  placeholder = "Rechercher une idée, un mot…",
  visibility,
}: {
  query: string;
  placeholder?: string;
  visibility?: string;
}) {
  return (
    <form className="search-form" role="search">
      <div className="search-input">
        <Search size={18} aria-hidden="true" />
        <label className="sr-only" htmlFor="search">
          Rechercher des post-it
        </label>
        <input
          id="search"
          type="search"
          name="q"
          defaultValue={query}
          maxLength={100}
          placeholder={placeholder}
        />
      </div>
      {visibility !== undefined && (
        <>
          <label htmlFor="visibility" className="sr-only">
            Visibilité
          </label>
          <select id="visibility" name="visibility" defaultValue={visibility}>
            <option value="all">Tous mes post-it</option>
            <option value="public">Publics</option>
            <option value="private">Privés</option>
          </select>
        </>
      )}
      <button className="button button-secondary" type="submit">
        Rechercher
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
}: {
  page: number;
  count: number;
  base: string;
  query?: string;
  visibility?: string;
}) {
  const pages = Math.max(1, Math.ceil(count / 12));
  function href(n: number) {
    const p = new URLSearchParams({ page: String(n) });
    if (query) p.set("q", query);
    if (visibility) p.set("visibility", visibility);
    return `${base}?${p}`;
  }
  if (pages <= 1 && page === 1) return null;
  return (
    <nav aria-label="Pagination des post-it" className="pagination">
      {page > 1 ? (
        <Link className="button button-secondary" href={href(page - 1)}>
          Précédent
        </Link>
      ) : (
        <span />
      )}
      <span>
        Page {page} · {count} post-it
      </span>
      {page < pages ? (
        <Link className="button button-secondary" href={href(page + 1)}>
          Suivant
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
export function formatDate(date: string, full = false) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: full ? "long" : "short",
    ...(full ? { year: "numeric" } : {}),
    timeZone: "Europe/Paris",
  }).format(new Date(date));
}
