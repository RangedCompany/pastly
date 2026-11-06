"use client";
import { useTranslations } from "@/components/i18n";
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
  const t = useTranslations();
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
        aria-label={t("Supprimer « {value0} »", { value0: title })}
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
          <h2 id={`delete-${id}`}>{t("Supprimer ce contenu ?")}</h2>
          <p>
            {t(
              "« {title} » sera définitivement supprimé. Cette action est irréversible.",
              { title },
            )}
          </p>
          <FormMessage state={state} />
          <div className="dialog-actions">
            <button
              type="button"
              className="button button-secondary"
              onClick={() => dialog.current?.close()}
              disabled={pending}
            >
              {t("Annuler")}
            </button>
            <button
              type="submit"
              className="button button-danger"
              disabled={pending}
            >
              {pending ? t("Suppression…") : t("Supprimer")}
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
  const t = useTranslations();
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
          title={isPublic ? t("Rendre privé") : t("Rendre public")}
          aria-label={
            isPublic
              ? t("Rendre ce contenu privé")
              : t("Rendre ce contenu public")
          }
        >
          {isPublic ? <Globe2 size={12} /> : <LockKeyhole size={12} />}
          {pending ? "…" : isPublic ? t("Public") : t("Privé")}
        </button>
      </form>
      <FormMessage state={state} />
    </div>
  );
}
