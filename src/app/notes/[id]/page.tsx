import { getTranslations } from "@/lib/i18n/server";
import { formatDate } from "@/lib/date";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Globe2, LockKeyhole, Pencil } from "lucide-react";
import { getIdentity } from "@/lib/auth";
import { getNote } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/env";
import { idSchema } from "@/lib/validation";
import { UserAvatar } from "@/components/ui";
import { ShareButton } from "@/components/share-button";
import { RawLink } from "@/components/raw-link";
import { ContentPreview } from "@/components/viewer/content-preview";
import { DocumentActions } from "@/components/viewer/document-actions";
import { FORMAT_LABELS } from "@/lib/viewer/types";
import { avatarUrl } from "@/lib/avatar";
import {
  ConfirmDeleteDialog,
  QuickVisibility,
} from "@/components/note-controls";

// Métadonnées volontairement génériques : un ancien aperçu ne doit pas conserver le contenu d'une note devenue privée.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t("Un contenu à découvrir"),
    description: t("Une idée partagée sur Pastly."),
    robots: { index: false, follow: false },
  };
}
export default async function NotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = await getTranslations();
  const { id } = await params;
  if (!isSupabaseConfigured() || !idSchema.safeParse(id).success) notFound();
  const note = await getNote(id);
  if (!note) notFound();
  const user = await getIdentity(),
    owned = user?.id === note.owner_id;
  return (
    <div className="container">
      <div
        className={note.format === "note" ? "note-detail" : "document-detail"}
      >
        <Link href={owned ? "/dashboard" : "/explore"} className="back-link">
          <ArrowLeft size={16} />
          {owned ? t("Ma bibliothèque") : t("Explorer les contenus")}
        </Link>
        <article
          className={
            note.format === "note"
              ? `detail-paper paper-${note.color}`
              : "detail-document"
          }
        >
          <div className="detail-meta">
            <time dateTime={note.created_at}>
              {t("Publié le")} {formatDate(note.created_at, true, t.locale)}
            </time>
            <span className="visibility-chip">
              {note.is_public ? (
                <Globe2 size={13} />
              ) : (
                <LockKeyhole size={13} />
              )}
              {note.is_public
                ? t("Contenu public")
                : t("Privé · visible par vous uniquement")}
            </span>
          </div>
          <h1>{note.title}</h1>
          <RawLink id={id} />
          {note.format === "note" ? (
            <p className="detail-content">{note.content}</p>
          ) : (
            <>
              <span className="format-badge">
                {t(FORMAT_LABELS[note.format])}
              </span>
              <DocumentActions
                content={note.content}
                format={note.format}
                filename={note.original_filename}
              />
              <ContentPreview content={note.content} format={note.format} />
              <noscript>
                {t("Le rendu de ce format nécessite JavaScript.")}
                <pre className="document-source">{note.content}</pre>
              </noscript>
            </>
          )}
          <div className="detail-footer">
            {note.author && (
              <Link className="note-author" href={`/u/${note.author.username}`}>
                <UserAvatar
                  name={note.author.display_name}
                  src={avatarUrl(note.author.avatar_path)}
                  small
                />
                {note.author.display_name}
              </Link>
            )}
            {note.is_public && <ShareButton id={id} label />}
          </div>
        </article>
        {owned && (
          <div className="detail-actions">
            <QuickVisibility id={id} isPublic={note.is_public} />
            <Link
              className="button button-secondary"
              href={`/notes/${id}/edit`}
            >
              <Pencil size={15} />
              {t("Modifier")}
            </Link>
            <ConfirmDeleteDialog id={id} title={note.title} />
          </div>
        )}
      </div>
    </div>
  );
}
