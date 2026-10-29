"use client";
import { useState } from "react";
import { Check, Link2 } from "lucide-react";
export function ShareButton({
  id,
  label = false,
}: {
  id: string;
  label?: boolean;
}) {
  const [status, setStatus] = useState("");
  async function share() {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/notes/${id}`,
      );
      setStatus("Lien copié !");
    } catch {
      setStatus("Copie impossible. Copiez l’adresse de la page du post-it.");
    }
  }
  return (
    <span className="share-control">
      <button
        type="button"
        onClick={share}
        className={label ? "button button-secondary" : "icon-button"}
        aria-label="Copier le lien du post-it"
        title="Copier le lien"
      >
        {status === "Lien copié !" ? <Check size={16} /> : <Link2 size={16} />}
        {label && "Partager"}
      </button>
      {status && (
        <span className="share-feedback" role="status">
          {status}
        </span>
      )}
    </span>
  );
}
