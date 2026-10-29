"use client";

import { useActionState, useEffect, useRef } from "react";
import { ShieldCheck } from "lucide-react";
import { setAdminRole } from "@/app/actions/admin";
import type { AdminAccount } from "@/lib/admin.types";
import { FormMessage } from "./ui";

export function AdminRoleControl({
  account,
  currentUserId,
}: {
  account: AdminAccount;
  currentUserId: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [state, action, pending] = useActionState(setAdminRole, {});
  const name = account.email ?? account.username ?? account.id;

  useEffect(() => {
    if (state.success) dialog.current?.close();
  }, [state]);

  if (account.id === currentUserId)
    return <span className="admin-self">Votre compte · droits protégés</span>;
  if (!account.is_admin && !account.email_confirmed_at)
    return (
      <span className="admin-self">
        Confirmation requise pour devenir admin
      </span>
    );

  return (
    <div className="admin-role-control">
      <button
        type="button"
        className="button button-secondary"
        onClick={() => dialog.current?.showModal()}
      >
        <ShieldCheck size={17} aria-hidden="true" />
        {account.is_admin
          ? "Retirer les droits admin"
          : "Nommer administrateur"}
        <span className="sr-only"> : {name}</span>
      </button>
      {state.success && (
        <p className="message message-success" role="status">
          {state.success}
        </p>
      )}
      <dialog
        ref={dialog}
        className="confirm-dialog"
        aria-labelledby={`role-${account.id}`}
        onCancel={(event) => {
          if (pending) event.preventDefault();
        }}
      >
        <form action={action}>
          <input type="hidden" name="user_id" value={account.id} />
          <input
            type="hidden"
            name="is_admin"
            value={String(!account.is_admin)}
          />
          <h2 id={`role-${account.id}`}>
            {account.is_admin
              ? "Retirer cet accès ?"
              : "Accorder un accès admin ?"}
          </h2>
          <p>
            {name}{" "}
            {account.is_admin
              ? "perdra l’accès à la supervision et à la gestion des administrateurs."
              : "pourra consulter les comptes, leurs emails et leurs statistiques, et gérer les autres administrateurs."}
          </p>
          {state.error && <FormMessage state={{ error: state.error }} />}
          <div className="dialog-actions">
            <button
              type="button"
              className="button button-secondary"
              disabled={pending}
              onClick={() => dialog.current?.close()}
            >
              Annuler
            </button>
            <button
              className={`button ${account.is_admin ? "button-danger" : "button-primary"}`}
              disabled={pending}
            >
              {pending
                ? "Enregistrement…"
                : account.is_admin
                  ? "Confirmer le retrait"
                  : "Confirmer l’accès"}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
