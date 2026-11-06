import type { Metadata } from "next";
import { requireIdentity } from "@/lib/auth";
import { NoteEditor } from "@/components/note-editor";
export const metadata: Metadata = {
  title: "Créer une note",
  robots: { index: false },
};
export default async function NewNote() {
  await requireIdentity("/notes/new");
  return (
    <div className="container">
      <NoteEditor />
    </div>
  );
}
