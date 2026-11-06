import { getTranslations } from "@/lib/i18n/server";
import { formatDate } from "@/lib/date";
import Link from "next/link";
import { ArrowUpRight, LockKeyhole, Pencil } from "lucide-react";
import type { NoteWithAuthor } from "@/lib/database.types";
import { UserAvatar } from "./ui";
import { ShareButton } from "./share-button";
import { ConfirmDeleteDialog, QuickVisibility } from "./note-controls";
import { FORMAT_LABELS } from "@/lib/viewer/types";
import { avatarUrl } from "@/lib/avatar";

export async function NoteCard({
  note,
  owned = false,
}: {
  note: NoteWithAuthor;
  owned?: boolean;
}) {
  const t = await getTranslations();
  const author = note.author;
  return (
    <article
      className={`note-card ${note.format === "note" ? `paper-${note.color}` : `document-card document-${note.content_kind}`}`}
    >
      <div className="note-card-top">
        <time dateTime={note.updated_at} title={t("Dernière modification")}>
          {formatDate(note.updated_at, false, t.locale)}
        </time>
        {owned ? (
          <QuickVisibility id={note.id} isPublic={note.is_public} />
        ) : (
          <ArrowUpRight size={17} aria-hidden="true" />
        )}
      </div>
      <Link
        className="note-card-link"
        href={`/notes/${note.id}`}
        prefetch={false}
      >
        <h2>{note.title}</h2>
        {note.format !== "note" && (
          <span className="format-badge">{t(FORMAT_LABELS[note.format])}</span>
        )}
        <p>{note.content.slice(0, 500)}</p>
      </Link>
      <div className="note-card-footer">
        {author ? (
          <Link className="note-author" href={`/u/${author.username}`}>
            <UserAvatar
              name={author.display_name}
              src={avatarUrl(author.avatar_path)}
              small
            />
            <span>{author.display_name}</span>
          </Link>
        ) : (
          <span>{t("Un membre Pastly")}</span>
        )}
        <div className="note-tools">
          {owned && (
            <>
              <Link
                href={`/notes/${note.id}/edit`}
                className="icon-button"
                aria-label={t("Modifier « {value0} »", { value0: note.title })}
              >
                <Pencil size={15} />
              </Link>
              <ConfirmDeleteDialog id={note.id} title={note.title} />
            </>
          )}
          {note.is_public ? (
            <ShareButton id={note.id} />
          ) : (
            <LockKeyhole size={15} aria-label={t("Note privée")} />
          )}
        </div>
      </div>
    </article>
  );
}
export function NoteGrid({
  notes,
  owned = false,
}: {
  notes: NoteWithAuthor[];
  owned?: boolean;
}) {
  return (
    <div className="note-grid">
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} owned={owned} />
      ))}
    </div>
  );
}
