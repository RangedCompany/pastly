import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownWideNarrow, Plus } from "lucide-react";
import { NoteGrid } from "@/components/note-card";
import {
  EmptyState,
  Pagination,
  SearchBar,
  SetupNotice,
} from "@/components/ui";
import { listNotes } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/env";
import { parsePage, searchTerm } from "@/lib/validation";
export const metadata: Metadata = {
  title: "Explorer",
  description:
    "Découvrez les documents, diagrammes, données et post-it publics de la communauté Pastly.",
};
export default async function Explore({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; format?: string }>;
}) {
  const params = await searchParams;
  const query = searchTerm(params.q),
    page = parsePage(params.page);
  const configured = isSupabaseConfigured();
  const { notes, count } = configured
    ? await listNotes({ page, query, format: params.format })
    : { notes: [], count: 0 };
  return (
    <div className="container">
      <div className="heading-row">
        <div className="page-heading">
          <span className="eyebrow">LE MUR DES IDÉES</span>
          <h1>
            Un peu de tout.
            <br />
            Beaucoup d’inspiration.
          </h1>
          <p>
            Des pensées en passant, des découvertes à partager. Promenez-vous
            parmi les documents, diagrammes et post-it publics de la communauté.
          </p>
        </div>
        <Link href="/" className="button button-primary">
          <Plus size={17} />
          Ajouter mon idée
        </Link>
      </div>
      {!configured && <SetupNotice />}
      <div className="toolbar">
        <SearchBar query={query} format={params.format} />
      </div>
      <div className="wall-caption">
        <span>
          {count} contenu{count > 1 ? "s" : ""} public{count > 1 ? "s" : ""}
          {query && ` pour « ${query} »`}
        </span>
        <span>
          <ArrowDownWideNarrow size={14} />
          Les plus récents d’abord
        </span>
      </div>
      {notes.length ? (
        <NoteGrid notes={notes} />
      ) : (
        <EmptyState
          title={
            query
              ? "Cette idée se fait encore discrète."
              : "Le mur attend ses premières idées."
          }
          description={
            query
              ? "Essayez d’autres mots ou effacez votre recherche."
              : "Les contenus publics apparaîtront ici. Et si vous commenciez ?"
          }
          href={query ? "/explore" : "/notes/new"}
          label={query ? "Voir tous les post-it" : "Créer le premier post-it"}
        />
      )}
      <Pagination
        page={page}
        count={count}
        base="/explore"
        query={query}
        format={params.format}
      />
    </div>
  );
}
