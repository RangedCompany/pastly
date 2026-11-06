"use client";
import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Download, Maximize2, Minimize2, Save, Upload, Trash2, Code2, Eye, Columns2, GripVertical } from "lucide-react";
import { saveNote } from "@/app/actions/notes";
import { detectContent } from "@/lib/viewer/detect";
import {
  FORMATS,
  FORMAT_LABELS,
  MAX_FILE_BYTES,
  MAX_TEXT_LENGTH,
  type ContentFormat,
} from "@/lib/viewer/types";
import { downloadSource, downloadBlob } from "@/lib/viewer/download";
import type { Note } from "@/lib/database.types";
import type { NoteColor } from "@/lib/constants";
import { ContentPreview } from "./content-preview";
import { FormatPicker } from "./format-picker";
import { CopyButton } from "./copy-button";
import { ColorPicker, VisibilityToggle } from "../note-editor";
import { FormMessage } from "../ui";
import dynamic from "next/dynamic";
const FilePreview = dynamic(() => import("./file-preview"), {
  loading: () => <p role="status">Ouverture du fichier…</p>,
});
const DRAFT_KEY = "pastly-v2-explicit-draft";
export function ViewerWorkspace({
  note,
  authenticated = false,
  configured = false,
  resumeDraft = false,
}: {
  note?: Note;
  authenticated?: boolean;
  configured?: boolean;
  resumeDraft?: boolean;
}) {
  const [content, setContent] = useState(note?.content ?? "");
  const [preview, setPreview] = useState(content);
  const [manualFormat, setManualFormat] = useState<ContentFormat>(
    note?.format ?? "text",
  );
  const [auto, setAuto] = useState(!note);
  const [filename, setFilename] = useState<string | null>(
    note?.original_filename ?? null,
  );
  const [mode, setMode] = useState<"source" | "preview" | "split">(
    note ? "preview" : "split",
  );
  const [split, setSplit] = useState(50);
  const panes = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [saving, setSaving] = useState(!!note);
  const [title, setTitle] = useState(note?.title ?? "");
  const [color, setColor] = useState<NoteColor>(note?.color ?? "yellow");
  const [isPublic, setIsPublic] = useState(note?.is_public ?? false);
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const acquisition = useRef(0);
  const [state, action, pending] = useActionState(
    saveNote.bind(null, note?.id ?? null),
    {},
  );
  const detection = useMemo(() => detectContent({ content, filename }), [content, filename]);
  const format = auto ? detection.format : manualFormat;
  useEffect(() => {
    const timer = setTimeout(() => setPreview(content), 300);
    return () => clearTimeout(timer);
  }, [content]);
  useEffect(() => {
    if (!resumeDraft || note) return;
    const timer = setTimeout(() => {
      try {
        const raw = sessionStorage.getItem(DRAFT_KEY);
        if (!raw) return;
        const draft = JSON.parse(raw);
        if (
          typeof draft.content === "string" &&
          draft.content.length <= MAX_TEXT_LENGTH &&
          FORMATS.includes(draft.format)
        ) {
          setContent(draft.content);
          setPreview(draft.content);
          setManualFormat(draft.format);
          setAuto(false);
          if (typeof draft.title === "string")
            setTitle(draft.title.slice(0, 120));
          if (typeof draft.filename === "string") setFilename(draft.filename);
          setSaving(true);
          setMessage(
            "Brouillon restauré dans cet onglet. Choisissez un titre pour l’enregistrer.",
          );
        }
        sessionStorage.removeItem(DRAFT_KEY);
      } catch {
        setMessage("Le brouillon n’a pas pu être restauré.");
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [resumeDraft, note]);
  useEffect(() => {
    if (!fullscreen) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [fullscreen]);
  async function openFile(selected?: File) {
    const request = ++acquisition.current;
    if (!selected) return;
    if (note) {
      setMessage(
        "Pour conserver ce document, importez un fichier depuis l’accueil.",
      );
      return;
    }
    if (selected.size > MAX_FILE_BYTES) {
      setMessage(
        "Fichier trop volumineux : maximum 10 Mio. Votre texte est conservé.",
      );
      return;
    }
    try {
      const binary =
        /\.(?:png|jpe?g|webp|gif|svg|pdf|docx|xlsx)$/i.test(selected.name) ||
        /^(?:image\/|application\/pdf)/.test(selected.type);
      if (binary) {
        setFile(selected);
        setMessage("");
        return;
      }
      if (selected.size > MAX_TEXT_LENGTH * 4)
        throw new Error("Un texte est limité à 100 000 caractères.");
      const text = new TextDecoder("utf-8", {
        fatal: true,
        ignoreBOM: true,
      }).decode(await selected.arrayBuffer());
      if (request !== acquisition.current) return;
      if (text.includes("\0"))
        throw new Error(
          "Ce fichier binaire n’est pas pris en charge. Ouvrez un fichier texte UTF-8 ou un format proposé.",
        );
      if (text.length > MAX_TEXT_LENGTH)
        throw new Error("Un texte est limité à 100 000 caractères.");
      setFile(null);
      setContent(text);
      setPreview(text);
      setFilename(selected.name);
      setAuto(true);
      setMessage("");
    } catch (error) {
      if (request === acquisition.current) {
        if (
          error instanceof TypeError ||
          (error instanceof Error && error.message.includes("binaire"))
        ) {
          setFile(selected);
          setMessage(
            "Ce fichier ne peut pas être lu comme texte UTF-8. Votre source est conservée ; l’original reste téléchargeable.",
          );
        } else
          setMessage(
            error instanceof Error
              ? error.message
              : "Lecture du fichier impossible.",
          );
      }
    }
  }
  function clearSource() {
    ++acquisition.current;
    setContent(""); setPreview(""); setFilename(null); setFile(null); setAuto(true); setMessage("");
    document.getElementById("viewer-source")?.focus();
  }
  function resizeSplit(clientX: number, clientY: number) {
    const bounds = panes.current?.getBoundingClientRect();
    if (!bounds) return;
    const stacked = window.matchMedia("(max-width: 760px)").matches;
    const ratio = stacked ? (clientY - bounds.top) / bounds.height : (clientX - bounds.left) / bounds.width;
    setSplit(Math.max(15, Math.min(85, ratio * 100)));
  }
  function saveDraft() {
    try {
      sessionStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ content, format, title, filename }),
      );
      return true;
    } catch {
      setMessage(
        "Brouillon indisponible. Téléchargez votre source avant de vous connecter.",
      );
      return false;
    }
  }
  return (
    <section
      className={`viewer-workspace ${fullscreen ? "workspace-fullscreen" : ""}`}
      aria-label="Atelier de visualisation"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        void openFile(e.dataTransfer.files[0]);
      }}
    >
      <div className="workspace-acquisition">
        <div className="acquisition-actions">
          <button
            type="button"
            className="button button-quiet"
            onClick={() => fileInput.current?.click()}
          >
            <Upload size={15} />
            Ouvrir un fichier
          </button>
          <input
            ref={fileInput}
            type="file"
            className="sr-only"
            aria-label="Ouvrir un fichier local"
            onChange={(e) => {
              void openFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>
      </div>
      {file ? (
        <div className="local-file">
          <div className="render-toolbar">
            <strong>{file.name}</strong>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => downloadBlob(file, file.name)}
            >
              Télécharger l’original
            </button>
            <button
              type="button"
              className="button button-quiet"
              onClick={() => {
                ++acquisition.current;
                setFile(null);
              }}
            >
              Retour au texte
            </button>
          </div>
          <p className="viewer-hint">
            Fichier local · aucun téléversement · sauvegarde des fichiers
            binaires indisponible.
          </p>
          <FilePreview file={file} />
        </div>
      ) : (
        <form action={action}>
          <input type="hidden" name="content" value={content} />
          <input type="hidden" name="format" value={format} />
          <input
            type="hidden"
            name="original_filename"
            value={filename ?? ""}
          />
          {!saving && (
            <>
              <input type="hidden" name="title" value={title} />
              <input type="hidden" name="is_public" value={String(isPublic)} />
              <input type="hidden" name="color" value={color} />
            </>
          )}
          <div className="workspace-toolbar">
            <FormatPicker format={format} auto={auto} onChange={(next) => {
              setAuto(next === "auto");
              if (next !== "auto") setManualFormat(next);
            }} />
            <div
              className="mode-switch"
              role="group"
              aria-label="Mode de l’éditeur"
            >
              {(["source", "preview", "split"] as const).map((value) => (
                <button
                  type="button"
                  key={value}
                  aria-pressed={mode === value}
                  onClick={() => setMode(value)}
                >
                  {value === "source" ? <Code2 size={16} /> : value === "preview" ? <Eye size={16} /> : <Columns2 size={16} />}
                  {value === "source"
                    ? "Source"
                    : value === "preview"
                      ? "Aperçu"
                      : "Divisé"}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="icon-button"
              aria-label={fullscreen ? "Quitter le plein écran" : "Plein écran"}
              onClick={() => setFullscreen(!fullscreen)}
            >
              {fullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
          </div>
          <div ref={panes} className={`workspace-panes mode-${mode}`} style={{ "--source-size": `${split}fr`, "--preview-size": `${100 - split}fr` } as CSSProperties}>
            {mode !== "preview" && (
              <div className="source-pane">
                <div className="pane-heading">
                  <label htmlFor="viewer-source">
                    Source {filename && <span>{filename}</span>}
                  </label>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label="Effacer"
                    title="Effacer la source"
                    disabled={!content}
                    onClick={clearSource}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <textarea
                  id="viewer-source"
                  value={content}
                  maxLength={MAX_TEXT_LENGTH}
                  spellCheck={false}
                  placeholder={
                    "Collez du texte ou glissez un fichier…"
                  }
                  onChange={(e) => {
                    ++acquisition.current;
                    setContent(e.target.value);
                  }}
                  onPaste={(e) => {
                    const selected =
                      e.currentTarget.selectionEnd -
                      e.currentTarget.selectionStart;
                    if (
                      e.clipboardData.getData("text").length +
                        content.length -
                        selected >
                      MAX_TEXT_LENGTH
                    ) {
                      e.preventDefault();
                      setMessage(
                        "Ce collage dépasse la limite de 100 000 caractères. Votre texte est conservé.",
                      );
                    }
                  }}
                />
                <span className="source-count">
                  {content.length.toLocaleString("fr-FR")} / 100 000
                </span>
              </div>
            )}
            {mode === "split" && (
              <div className="split-handle" role="separator" tabIndex={0}
                aria-label="Redimensionner les panneaux" aria-orientation="vertical"
                aria-valuemin={15} aria-valuemax={85} aria-valuenow={Math.round(split)}
                onPointerDown={(event) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); }}
                onPointerMove={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) resizeSplit(event.clientX, event.clientY); }}
                onPointerUp={(event) => { event.currentTarget.releasePointerCapture(event.pointerId); }}
                onKeyDown={(event) => {
                  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) {
                    event.preventDefault();
                    setSplit(value => event.key === "Home" ? 15 : event.key === "End" ? 85 : Math.max(15, Math.min(85, value + (["ArrowLeft", "ArrowUp"].includes(event.key) ? -2 : 2))));
                  }
                }} onDoubleClick={() => setSplit(50)}><GripVertical size={14} /></div>
            )}
            {mode !== "source" && (
              <div className="preview-pane">
                <div className="pane-heading">
                  Aperçu <span>{FORMAT_LABELS[format]}</span>
                </div>
                <div className="preview-body" aria-busy={content !== preview}>
                  <ContentPreview
                    content={preview}
                    format={format}
                    color={color}
                  />
                </div>
              </div>
            )}
          </div>
          <div className="workspace-bottom">
            <div className="workspace-actions">
              <button type="button" className="icon-button" aria-label="Effacer" title="Effacer la source" disabled={!content} onClick={clearSource}><Trash2 size={15} /></button>
              <CopyButton value={content} />
              <button
                type="button"
                className="button button-quiet"
                disabled={!content}
                onClick={() => downloadSource(content, format, filename)}
              >
                <Download size={15} />
                Télécharger
              </button>
              <button
                type="button"
                className="button button-secondary"
                disabled={!content}
                onClick={() => {
                  setSaving(!saving);
                  setMessage("");
                }}
              >
                <Save size={15} />
                Sauvegarder
              </button>
            </div>
          </div>
          {saving && (
            <div className="workspace-save">
              {authenticated ? (
                <>
                  <label htmlFor="document-title">Titre</label>
                  <input
                    id="document-title"
                    name="title"
                    required
                    maxLength={120}
                    placeholder="Un titre pour le retrouver"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                  {format === "note" ? (
                    <ColorPicker color={color} onChange={setColor} />
                  ) : (
                    <input type="hidden" name="color" value={color} />
                  )}
                  <VisibilityToggle
                    isPublic={isPublic}
                    onChange={setIsPublic}
                  />
                  <FormMessage state={state} />
                  <button
                    type="submit"
                    className="button button-primary"
                    disabled={pending || !content}
                  >
                    {pending
                      ? "Enregistrement…"
                      : "Enregistrer dans ma bibliothèque"}
                  </button>
                </>
              ) : (
                <>
                  <h2>Gardez ce contenu dans votre bibliothèque.</h2>
                  <p>
                    {configured
                      ? "Connectez-vous pour sauvegarder. Votre brouillon sera conservé temporairement dans cet onglet, puis restauré après la connexion."
                      : "La sauvegarde nécessite une connexion Supabase configurée. Vous pouvez déjà visualiser, copier et télécharger votre contenu."}
                  </p>
                  {configured && (
                    <Link
                      className="button button-primary"
                      href="/login?next=%2F%3Fdraft%3D1"
                      onClick={(event) => {
                        if (!saveDraft()) event.preventDefault();
                      }}
                    >
                      Se connecter pour sauvegarder
                    </Link>
                  )}
                </>
              )}
            </div>
          )}
        </form>
      )}
      {message && (
        <p className="message message-error" role="status">
          {message}
        </p>
      )}
    </section>
  );
}
