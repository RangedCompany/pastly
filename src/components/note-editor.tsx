"use client";
import { useTranslations } from "@/components/i18n";
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
  const t = useTranslations();
  return (
    <fieldset className="color-picker">
      <legend>{t("Une couleur pour votre idée")}</legend>
      <div className="color-options">
        {COLORS.map((value) => (
          <label
            key={value}
            className={`color-option paper-${value}`}
            title={t(COLOR_LABELS[value])}
          >
            <input
              className="sr-only"
              type="radio"
              name="color"
              value={value}
              checked={color === value}
              onChange={() => onChange(value)}
            />
            <span className="sr-only">{t(COLOR_LABELS[value])}</span>
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
  const t = useTranslations();
  return (
    <fieldset className="visibility-picker">
      <legend>{t("Qui peut voir ce contenu ?")}</legend>
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
            <strong>{t("Public")}</strong>
            <small>{t("Visible dans Explorer et par lien")}</small>
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
            <strong>{t("Privé")}</strong>
            <small>{t("Rien que pour vous")}</small>
          </span>
        </label>
      </div>
      <p>
        {isPublic
          ? t("Votre idée sera visible par tout le monde, même sans compte.")
          : t(
              "Vous seul pourrez lire cette note. Son lien ne permettra plus de la consulter publiquement.",
            )}
      </p>
    </fieldset>
  );
}
export function NoteEditor({ note }: { note?: Note }) {
  const t = useTranslations();
  const [color, setColor] = useState<NoteColor>(note?.color ?? "yellow");
  const [isPublic, setIsPublic] = useState(note?.is_public ?? false);
  const [length, setLength] = useState(note?.content.length ?? 0);
  const [state, action, pending] = useActionState(
    saveNote.bind(null, note?.id ?? null),
    {},
  );
  return (
    <>
      <Link href="/dashboard" className="back-link">
        <ArrowLeft size={16} />
        {t("Mes notes")}
      </Link>
      <div className="page-heading">
        <span className="eyebrow">{t("L’ATELIER")}</span>
        <h1>
          {note
            ? t("Une idée, à peaufiner.")
            : t("Une petite note. Un début d’idée.")}
        </h1>
        <p>
          {t(
            "Posez vos mots, choisissez une couleur et laissez-leur une place.",
          )}
        </p>
      </div>
      <form action={action} className="editor-layout">
        <input type="hidden" name="format" value="note" />
        <input
          type="hidden"
          name="original_filename"
          value={note?.original_filename ?? ""}
        />
        <div className={`editor-paper paper-${color}`}>
          <label htmlFor="title">{t("Titre de la note")}</label>
          <input
            id="title"
            name="title"
            className="editor-title"
            placeholder={t("Donnez un titre à votre idée…")}
            required
            maxLength={120}
            defaultValue={note?.title}
          />
          <label htmlFor="content" className="sr-only">
            {t("Contenu de la note")}
          </label>
          <textarea
            id="content"
            name="content"
            className="editor-content"
            placeholder={t("Qu’est-ce qui vous passe par la tête ?")}
            required
            maxLength={5000}
            rows={12}
            defaultValue={note?.content}
            onChange={(e) => setLength(e.target.value.length)}
          />
          <span className="character-count">
            {length.toLocaleString(t.locale)} / 5 000
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
            {pending ? t("Enregistrement…") : t("Enregistrer la note")}
          </button>
          <Link className="button button-quiet full-width" href="/dashboard">
            {t("Annuler")}
          </Link>
        </aside>
      </form>
    </>
  );
}
