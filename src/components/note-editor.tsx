"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { ArrowLeft, Check, Globe2, LockKeyhole, Save } from "lucide-react";
import { COLORS, COLOR_LABELS, type NoteColor } from "@/lib/constants";
import type { Note } from "@/lib/database.types";
import { saveNote } from "@/app/actions/notes";
import { FormMessage } from "./ui";

export function ColorPicker({
  color,
  onChange,
}: {
  color: NoteColor;
  onChange: (value: NoteColor) => void;
}) {
  return (
    <fieldset className="color-picker">
      <legend>Une couleur pour votre idée</legend>
      <div className="color-options">
        {COLORS.map((value) => (
          <label
            key={value}
            className={`color-option paper-${value}`}
            title={COLOR_LABELS[value]}
          >
            <input
              className="sr-only"
              type="radio"
              name="color"
              value={value}
              checked={color === value}
              onChange={() => onChange(value)}
            />
            <span className="sr-only">{COLOR_LABELS[value]}</span>
            {color === value && <Check size={18} aria-hidden="true" />}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
export function VisibilityToggle({
  isPublic,
  onChange,
}: {
  isPublic: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <fieldset className="visibility-picker">
      <legend>Qui peut voir ce post-it ?</legend>
      <div className="visibility-options">
        <label className={isPublic ? "selected" : ""}>
          <input
            type="radio"
            name="is_public"
            value="true"
            checked={isPublic}
            onChange={() => onChange(true)}
          />
          <Globe2 size={18} />
          <span>
            <strong>Public</strong>
            <small>Visible dans Explorer et par lien</small>
          </span>
        </label>
        <label className={!isPublic ? "selected" : ""}>
          <input
            type="radio"
            name="is_public"
            value="false"
            checked={!isPublic}
            onChange={() => onChange(false)}
          />
          <LockKeyhole size={18} />
          <span>
            <strong>Privé</strong>
            <small>Rien que pour vous</small>
          </span>
        </label>
      </div>
      <p>
        {isPublic
          ? "Votre idée sera visible par tout le monde, même sans compte."
          : "Vous seul pourrez lire cette note. Son lien ne permettra plus de la consulter publiquement."}
      </p>
    </fieldset>
  );
}
export function NoteEditor({ note }: { note?: Note }) {
  const [color, setColor] = useState<NoteColor>(note?.color ?? "yellow");
  const [isPublic, setIsPublic] = useState(note?.is_public ?? true);
  const [length, setLength] = useState(note?.content.length ?? 0);
  const [state, action, pending] = useActionState(
    saveNote.bind(null, note?.id ?? null),
    {},
  );
  return (
    <>
      <Link href="/dashboard" className="back-link">
        <ArrowLeft size={16} />
        Mes post-it
      </Link>
      <div className="page-heading">
        <span className="eyebrow">L’ATELIER</span>
        <h1>
          {note
            ? "Une idée, à peaufiner."
            : "Une petite note. Un début d’idée."}
        </h1>
        <p>Posez vos mots, choisissez une couleur et laissez-leur une place.</p>
      </div>
      <form action={action} className="editor-layout">
        <div className={`editor-paper paper-${color}`}>
          <label htmlFor="title">Titre du post-it</label>
          <input
            id="title"
            name="title"
            className="editor-title"
            placeholder="Donnez un titre à votre idée…"
            required
            maxLength={120}
            defaultValue={note?.title}
          />
          <label htmlFor="content" className="sr-only">
            Contenu du post-it
          </label>
          <textarea
            id="content"
            name="content"
            className="editor-content"
            placeholder="Qu’est-ce qui vous passe par la tête ?"
            required
            maxLength={5000}
            rows={12}
            defaultValue={note?.content}
            onChange={(e) => setLength(e.target.value.length)}
          />
          <span className="character-count">
            {length.toLocaleString("fr-FR")} / 5 000
          </span>
        </div>
        <aside className="editor-settings">
          <ColorPicker color={color} onChange={setColor} />
          <VisibilityToggle isPublic={isPublic} onChange={setIsPublic} />
          <FormMessage state={state} />
          <button
            className="button button-primary full-width"
            disabled={pending}
            type="submit"
          >
            <Save size={17} />
            {pending ? "Enregistrement…" : "Enregistrer le post-it"}
          </button>
          <Link className="button button-quiet full-width" href="/dashboard">
            Annuler
          </Link>
        </aside>
      </form>
    </>
  );
}
