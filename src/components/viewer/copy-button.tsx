"use client";
import { useState } from "react";
export function CopyButton({
  value,
  label = "Copier",
}: {
  value: string;
  label?: string;
}) {
  const [status, setStatus] = useState("");
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setStatus("Copié");
    } catch {
      setStatus("Copie indisponible : sélectionnez le texte.");
    }
  }
  return (
    <span className="copy-control">
      <button type="button" className="button button-quiet" onClick={copy}>
        {label}
      </button>
      <span role="status">{status}</span>
    </span>
  );
}
