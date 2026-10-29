import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Globe2, LockKeyhole, Pencil } from "lucide-react";
import { getUser } from "@/lib/auth";
import { getNote } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/env";
import { idSchema } from "@/lib/validation";
import { formatDate, UserAvatar } from "@/components/ui";
import { ShareButton } from "@/components/share-button";
import {
  ConfirmDeleteDialog,
  QuickVisibility,
} from "@/components/note-controls";

// Métadonnées volontairement génériques : un ancien aperçu ne doit pas conserver le contenu d'une note devenue privée.
export const metadata: Metadata = {
  title: "Un post-it à découvrir",
  description: "Une idée partagée sur Pastly.",
  robots: { index: false, follow: false },
};
export default async function NotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isSupabaseConfigured() || !idSchema.safeParse(id).success) notFound();
  const note = await getNote(id);
  if (!note) notFound();
  const user = await getUser(),
    owned = user?.id === note.owner_id;
  return (
    <div className="container">
      <div className="note-detail">
        <Link href={owned ? "/dashboard" : "/explore"} className="back-link">
          <ArrowLeft size={16} />
          {owned ? "Mes post-it" : "Explorer les post-it"}
        </Link>
        <article className={`detail-paper paper-${note.color}`}>
          <div className="detail-meta">
            <time dateTime={note.created_at}>
              Publié le {formatDate(note.created_at, true)}
            </time>
            <span className="visibility-chip">
              {note.is_public ? (
                <Globe2 size={13} />
              ) : (
                <LockKeyhole size={13} />
              )}
              {note.is_public
                ? "Post-it public"
                : "Privé · visible par vous uniquement"}
            </span>
          </div>
          <h1>{note.title}</h1>
          <p className="detail-content">{note.content}</p>
          <div className="detail-footer">
            {note.author && (
              <Link className="note-author" href={`/u/${note.author.username}`}>
                <UserAvatar name={note.author.display_name} small />
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
              Modifier
            </Link>
            <ConfirmDeleteDialog id={id} title={note.title} />
          </div>
        )}
      </div>
    </div>
  );
}
