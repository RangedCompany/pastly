import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireIdentity } from "@/lib/auth";
import { getNote } from "@/lib/data";
import { idSchema } from "@/lib/validation";
import { NoteEditor } from "@/components/note-editor";
import { ViewerWorkspace } from "@/components/viewer/viewer-workspace";
export const metadata: Metadata = {
  title: "Modifier un contenu",
  robots: { index: false },
};
export default async function EditNote({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireIdentity(`/notes/${id}/edit`);
  if (!idSchema.safeParse(id).success) notFound();
  const note = await getNote(id);
  if (!note || note.owner_id !== user.id) notFound();
  return (
    <div
      className={
        note.format === "note"
          ? "container"
          : "container document-editor"
      }
    >
      {note.format === "note" ? (
        <NoteEditor note={note} />
      ) : (
        <>
          <h1 className="document-editor-title">Modifier le contenu</h1>
          <ViewerWorkspace note={note} authenticated configured />
        </>
      )}
    </div>
  );
}
