import { getTranslations } from "@/lib/i18n/server";
import type { Metadata } from "next";
import { requireIdentity } from "@/lib/auth";
import { NoteEditor } from "@/components/note-editor";
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t("Créer une note"),
    robots: { index: false },
  };
}
export default async function NewNote() {
  await requireIdentity("/notes/new");
  return (
    <div className="container">
      <NoteEditor />
    </div>
  );
}
