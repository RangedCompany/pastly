"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/data";
import { profileSchema, type ActionState } from "@/lib/validation";

export async function saveProfile(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const user = await requireUser("/profile");
  const parsed = profileSchema.safeParse({
    username: form.get("username"),
    display_name: form.get("display_name"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try {
    await ensureProfile();
  } catch {
    return { error: "Votre profil n’est pas disponible. Réessayez." };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update(parsed.data)
    .eq("id", user.id)
    .select("id")
    .maybeSingle();
  if (error?.code === "23505")
    return { error: "Ce nom d’utilisateur est déjà utilisé." };
  if (error || !data) return { error: "Le profil n’a pas pu être enregistré." };
  revalidatePath("/", "layout");
  return { success: "Votre profil a bien été enregistré." };
}
