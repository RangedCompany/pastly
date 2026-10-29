"use client";
import { useActionState, useRef } from "react";
import { Globe2, LockKeyhole, Trash2 } from "lucide-react";
import { deleteNote, setNoteVisibility } from "@/app/actions/notes";
import { FormMessage } from "./ui";

export function ConfirmDeleteDialog({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [state, action, pending] = useActionState(
    deleteNote.bind(null, id),
    {},
  );
  return (
    <>
      <button
        type="button"
        className="icon-button danger"
        aria-label={`Supprimer « ${title} »`}
        onClick={() => dialog.current?.showModal()}
      >
        <Trash2 size={16} />
      </button>
      <dialog
        ref={dialog}
        className="confirm-dialog"
        aria-labelledby={`delete-${id}`}
      >
        <form action={action}>
          <span className="dialog-icon">
            <Trash2 size={24} />
          </span>
          <h2 id={`delete-${id}`}>Supprimer ce post-it ?</h2>
          <p>
            « {title} » sera définitivement supprimé. Cette action est
            irréversible.
          </p>
          <FormMessage state={state} />
          <div className="dialog-actions">
            <button
              type="button"
              className="button button-secondary"
              onClick={() => dialog.current?.close()}
              disabled={pending}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="button button-danger"
              disabled={pending}
            >
              {pending ? "Suppression…" : "Supprimer"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
export function QuickVisibility({
  id,
  isPublic,
}: {
  id: string;
  isPublic: boolean;
}) {
  const [state, action, pending] = useActionState(
    setNoteVisibility.bind(null, id, !isPublic),
    {},
  );
  return (
    <div className="visibility-control">
      <form action={action}>
        <button
          className="visibility-chip"
          disabled={pending}
          title={isPublic ? "Rendre privé" : "Rendre public"}
          aria-label={
            isPublic ? "Rendre ce post-it privé" : "Rendre ce post-it public"
          }
        >
          {isPublic ? <Globe2 size={12} /> : <LockKeyhole size={12} />}
          {pending ? "…" : isPublic ? "Public" : "Privé"}
        </button>
      </form>
      <FormMessage state={state} />
    </div>
  );
}
