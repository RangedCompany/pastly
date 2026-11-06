import { getTranslations } from "@/lib/i18n/server";
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
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t("Explorer"),
    description: t(
      "Découvrez les documents, diagrammes, données et contenus publics de la communauté Pastly.",
    ),
  };
}
export default async function Explore({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; format?: string }>;
}) {
  const t = await getTranslations();
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
          <span className="eyebrow">{t("LE MUR DES IDÉES")}</span>
          <h1>
            {t("Un peu de tout.")}
            <br />
            {t("Beaucoup d’inspiration.")}
          </h1>
          <p>
            {t(
              "Des pensées en passant, des découvertes à partager. Promenez-vous parmi les documents, diagrammes et contenus publics de la communauté.",
            )}
          </p>
        </div>
        <Link href="/" className="button button-primary">
          <Plus size={17} />
          {t("Ajouter mon idée")}
        </Link>
      </div>
      {!configured && <SetupNotice />}
      <div className="toolbar">
        <SearchBar query={query} format={params.format} />
      </div>
      <div className="wall-caption">
        <span>
          {t.plural(
            "{count} contenu public",
            "{count} contenus publics",
            count,
          )}
          {query && <> {t("pour « {query} »", { query })}</>}
        </span>
        <span>
          <ArrowDownWideNarrow size={14} />
          {t("Les plus récents d’abord")}
        </span>
      </div>
      {notes.length ? (
        <NoteGrid notes={notes} />
      ) : (
        <EmptyState
          title={
            query
              ? t("Cette idée se fait encore discrète.")
              : t("Le mur attend ses premières idées.")
          }
          description={
            query
              ? t("Essayez d’autres mots ou effacez votre recherche.")
              : t(
                  "Les contenus publics apparaîtront ici. Et si vous commenciez ?",
                )
          }
          href={query ? "/explore" : "/notes/new"}
          label={
            query ? t("Voir toutes les notes") : t("Créer la première note")
          }
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
