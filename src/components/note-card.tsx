import Link from "next/link";
import { ArrowUpRight, LockKeyhole, Pencil } from "lucide-react";
import type { NoteWithAuthor } from "@/lib/database.types";
import { UserAvatar, formatDate } from "./ui";
import { ShareButton } from "./share-button";
import { ConfirmDeleteDialog, QuickVisibility } from "./note-controls";

export function NoteCard({
  note,
  owned = false,
}: {
  note: NoteWithAuthor;
  owned?: boolean;
}) {
  const author = note.author;
  return (
    <article className={`note-card paper-${note.color}`}>
      <div className="note-card-top">
        <time dateTime={note.created_at}>{formatDate(note.created_at)}</time>
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
        <p>{note.content}</p>
      </Link>
      <div className="note-card-footer">
        {author ? (
          <Link className="note-author" href={`/u/${author.username}`}>
            <UserAvatar name={author.display_name} small />
            <span>{author.display_name}</span>
          </Link>
        ) : (
          <span>Un membre Pastly</span>
        )}
        <div className="note-tools">
          {owned && (
            <>
              <Link
                href={`/notes/${note.id}/edit`}
                className="icon-button"
                aria-label={`Modifier « ${note.title} »`}
              >
                <Pencil size={15} />
              </Link>
              <ConfirmDeleteDialog id={note.id} title={note.title} />
            </>
          )}
          {note.is_public ? (
            <ShareButton id={note.id} />
          ) : (
            <LockKeyhole size={15} aria-label="Note privée" />
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
