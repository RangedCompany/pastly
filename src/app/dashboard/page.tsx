import type { Metadata } from "next";
import Link from "next/link";
import { Plus, ShieldCheck } from "lucide-react";
import { requireIdentity } from "@/lib/auth";
import { listNotes } from "@/lib/data";
import { parsePage, searchTerm } from "@/lib/validation";
import { NoteGrid } from "@/components/note-card";
import { EmptyState, Pagination, SearchBar } from "@/components/ui";
export const metadata: Metadata = {
  title: "Ma bibliothèque",
  robots: { index: false, follow: false },
};
export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    page?: string;
    visibility?: string;
    success?: string;
    error?: string;
    format?: string;
  }>;
}) {
  const user = await requireIdentity();
  const params = await searchParams;
  const query = searchTerm(params.q),
    page = parsePage(params.page);
  const visibility = ["public", "private"].includes(params.visibility ?? "")
    ? params.visibility!
    : "all";
  const { notes, count } = await listNotes({
    query,
    page,
    owner: user.id,
    visibility,
    format: params.format,
  });
  return (
    <div className="container">
      <div className="heading-row">
        <div className="page-heading">
          <span className="eyebrow">VOTRE ESPACE PERSONNEL</span>
          <h1>Ma bibliothèque.</h1>
          <p>
            Un coin à vous pour retrouver, organiser et faire grandir vos
            pensées.
          </p>
        </div>
        <Link href="/" className="button button-primary">
          <Plus size={17} />
          Nouveau contenu
        </Link>
      </div>
      {params.success === "saved" && (
        <p className="message message-success" role="status">
          Votre contenu a bien été enregistré.
        </p>
      )}
      {params.success === "deleted" && (
        <p className="message message-success" role="status">
          Votre contenu a été supprimé.
        </p>
      )}
      {params.error === "signout" && (
        <p className="message message-error" role="alert">
          Déconnexion impossible. Vérifiez votre connexion et réessayez.
        </p>
      )}
      <div className="toolbar">
        <SearchBar
          query={query}
          visibility={visibility}
          format={params.format}
          placeholder="Retrouver un contenu…"
        />
      </div>
      <div className="wall-caption">
        <span>
          {count} contenu{count > 1 ? "s" : ""}
        </span>
        <span>
          <ShieldCheck size={14} />
          Vous décidez de ce que vous partagez
        </span>
      </div>
      {notes.length ? (
        <NoteGrid notes={notes} owned />
      ) : (
        <EmptyState
          description={
            query ||
            visibility !== "all" ||
            (params.format && params.format !== "all")
              ? "Aucun contenu ne correspond à ces filtres."
              : "Votre première idée n’attend qu’un peu de place."
          }
          href="/notes/new"
        />
      )}
      <Pagination
        page={page}
        count={count}
        base="/dashboard"
        query={query}
        visibility={visibility}
        format={params.format}
      />
    </div>
  );
}
