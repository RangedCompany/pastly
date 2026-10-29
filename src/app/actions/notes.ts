"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/data";
import { idSchema, noteSchema, type ActionState } from "@/lib/validation";

function invalidate(id?: string) {
  revalidatePath("/", "layout");
  if (id) revalidatePath(`/notes/${id}`);
}
export async function saveNote(
  id: string | null,
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const user = await requireUser("/notes/new");
  const parsed = noteSchema.safeParse({
    title: form.get("title"),
    content: form.get("content"),
    color: form.get("color"),
    is_public: form.get("is_public") === "true",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (id && !idSchema.safeParse(id).success)
    return { error: "Ce post-it est introuvable." };
  const supabase = await createClient();
  if (!id) {
    try {
      await ensureProfile();
    } catch {
      return { error: "Votre profil n’a pas pu être préparé. Réessayez." };
    }
  }
  const result = id
    ? await supabase
        .from("notes")
        .update(parsed.data)
        .eq("id", id)
        .eq("owner_id", user.id)
        .select("id")
        .maybeSingle()
    : await supabase
        .from("notes")
        .insert({ ...parsed.data, owner_id: user.id })
        .select("id")
        .single();
  if (result.error || !result.data)
    return {
      error:
        "Enregistrement impossible. Vérifiez votre connexion et réessayez.",
    };
  invalidate(result.data.id);
  redirect("/dashboard?success=saved");
}
export async function deleteNote(
  id: string,
  _: ActionState,
): Promise<ActionState> {
  void _;
  const user = await requireUser();
  if (!idSchema.safeParse(id).success)
    return { error: "Ce post-it est introuvable." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notes")
    .delete()
    .eq("id", id)
    .eq("owner_id", user.id)
    .select("id")
    .maybeSingle();
  if (error || !data) return { error: "Suppression impossible. Réessayez." };
  invalidate(id);
  redirect("/dashboard?success=deleted");
}
export async function setNoteVisibility(
  id: string,
  isPublic: boolean,
  _: ActionState,
): Promise<ActionState> {
  void _;
  const user = await requireUser();
  if (!idSchema.safeParse(id).success || typeof isPublic !== "boolean")
    return { error: "Demande invalide." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notes")
    .update({ is_public: isPublic })
    .eq("id", id)
    .eq("owner_id", user.id)
    .select("id")
    .maybeSingle();
  if (error || !data)
    return { error: "La visibilité n’a pas pu être modifiée." };
  invalidate(id);
  return {
    success: isPublic
      ? "Ce post-it est maintenant public."
      : "Ce post-it est maintenant privé.",
  };
}
