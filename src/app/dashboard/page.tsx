import type { Metadata } from "next";
import Link from "next/link";
import { Plus, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { listNotes } from "@/lib/data";
import { parsePage, searchTerm } from "@/lib/validation";
import { NoteGrid } from "@/components/note-card";
import { EmptyState, Pagination, SearchBar } from "@/components/ui";
export const metadata: Metadata = {
  title: "Mes post-it",
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
  }>;
}) {
  const user = await requireUser();
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
  });
  return (
    <div className="container">
      <div className="heading-row">
        <div className="page-heading">
          <span className="eyebrow">VOTRE ESPACE PERSONNEL</span>
          <h1>Mes petites idées.</h1>
          <p>
            Un coin à vous pour retrouver, organiser et faire grandir vos
            pensées.
          </p>
        </div>
        <Link href="/notes/new" className="button button-primary">
          <Plus size={17} />
          Créer un post-it
        </Link>
      </div>
      {params.success === "saved" && (
        <p className="message message-success" role="status">
          Votre post-it a bien été enregistré.
        </p>
      )}
      {params.success === "deleted" && (
        <p className="message message-success" role="status">
          Votre post-it a été supprimé.
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
          placeholder="Retrouver un de mes post-it…"
        />
      </div>
      <div className="wall-caption">
        <span>
          {count} post-it{count > 1 ? "s" : ""}
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
            query || visibility !== "all"
              ? "Aucun post-it ne correspond à ces filtres."
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
      />
    </div>
  );
}
