import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { NoteEditor } from "@/components/note-editor";
export const metadata: Metadata = {
  title: "Créer un post-it",
  robots: { index: false },
};
export default async function NewNote() {
  await requireUser("/notes/new");
  return (
    <div className="container narrow">
      <NoteEditor />
    </div>
  );
}
