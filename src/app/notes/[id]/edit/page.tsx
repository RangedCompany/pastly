import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getNote } from "@/lib/data";
import { idSchema } from "@/lib/validation";
import { NoteEditor } from "@/components/note-editor";
export const metadata: Metadata = {
  title: "Modifier un post-it",
  robots: { index: false },
};
export default async function EditNote({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser(`/notes/${id}/edit`);
  if (!idSchema.safeParse(id).success) notFound();
  const note = await getNote(id);
  if (!note || note.owner_id !== user.id) notFound();
  return (
    <div className="container narrow">
      <NoteEditor note={note} />
    </div>
  );
}
