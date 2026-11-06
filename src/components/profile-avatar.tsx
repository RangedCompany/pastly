"use client";

import { useRef, useState, useTransition } from "react";
import { LoaderCircle, Pencil } from "lucide-react";
import { removeAvatar, uploadAvatar } from "@/app/actions/profile";
import { AVATAR_TYPES, MAX_AVATAR_BYTES, avatarUrl } from "@/lib/avatar";
import type { ActionState } from "@/lib/validation";
import { UserAvatar } from "./user-avatar";
import { FormMessage } from "./ui";

export function ProfileAvatar({ name, avatarPath }: { name: string; avatarPath: string | null }) {
  const input = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<ActionState>({});
  const [path, setPath] = useState(avatarPath);
  const [pending, startTransition] = useTransition();

  function save(file: File) {
    setState({});
    if (!AVATAR_TYPES.includes(file.type)) {
      setState({ error: "Choisissez une image JPG, PNG ou WebP." });
      return;
    }
    if (!file.size || file.size > MAX_AVATAR_BYTES) {
      setState({ error: "Choisissez une image de 2 Mo maximum." });
      return;
    }
    const form = new FormData();
    form.set("avatar", file);
    startTransition(async () => {
      try {
        const result = await uploadAvatar(form);
        setState(result);
        if (result.success) setPath(result.avatarPath ?? null);
      } catch {
        setState({ error: "La photo n’a pas pu être enregistrée. Réessayez." });
      }
    });
  }

  return (
    <div className="profile-avatar">
      <button type="button" className="avatar-edit" disabled={pending}
        aria-label="Modifier la photo de profil" title="Modifier la photo de profil"
        aria-busy={pending} onClick={() => input.current?.click()}>
        <UserAvatar name={name} src={avatarUrl(path)} />
        <span className={`avatar-edit-overlay ${pending ? "is-pending" : ""}`} aria-hidden="true">
          {pending ? <LoaderCircle size={22} className="avatar-spinner" /> : <Pencil size={22} />}
        </span>
      </button>
      <input ref={input} type="file" className="sr-only" tabIndex={-1}
        aria-label="Choisir une photo de profil" accept={AVATAR_TYPES.join(",")}
        disabled={pending} onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = "";
          if (file) save(file);
        }} />
      {path && (
        <button type="button" className="avatar-remove" disabled={pending}
          onClick={() => startTransition(async () => {
            setState({});
            try {
              const result = await removeAvatar();
              setState(result);
              if (result.success) setPath(null);
            } catch {
              setState({ error: "La photo n’a pas pu être supprimée. Réessayez." });
            }
          })}>Supprimer la photo</button>
      )}
      <p className="avatar-hint">JPG, PNG ou WebP · 2 Mo max.<br />Photo visible sur votre profil public.</p>
      <FormMessage state={state} />
    </div>
  );
}
