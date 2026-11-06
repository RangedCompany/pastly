"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/data";
import { profileSchema, type ActionState } from "@/lib/validation";
import { AVATAR_BUCKET } from "@/lib/avatar";
import { prepareAvatar } from "@/lib/avatar-image";

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

type AvatarState = ActionState & { avatarPath?: string | null };

async function deleteAvatarFile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  path: string | null,
  owner: string,
) {
  if (!path?.startsWith(`${owner}/`)) return;
  try {
    const { error } = await supabase.storage.from(AVATAR_BUCKET).remove([path]);
    if (error) console.warn("Nettoyage de l’ancienne photo de profil à réessayer.");
  } catch {
    console.warn("Nettoyage de l’ancienne photo de profil à réessayer.");
  }
}

export async function uploadAvatar(form: FormData): Promise<AvatarState> {
  const user = await requireUser("/profile");
  const file = form.get("avatar");
  if (!(file instanceof File)) return { error: "Choisissez une photo de profil." };
  let image: Buffer;
  try {
    image = await prepareAvatar(file);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Image invalide." };
  }
  try {
    const profile = await ensureProfile();
    const supabase = await createClient();
    const path = `${user.id}/${crypto.randomUUID()}.webp`;
    const { error: uploadError } = await supabase.storage.from(AVATAR_BUCKET)
      .upload(path, image, { contentType: "image/webp", cacheControl: "60", upsert: false });
    if (uploadError) return { error: "La photo n’a pas pu être envoyée. Réessayez." };
    let saved = false;
    try {
      const { data, error } = await supabase.from("profiles")
        .update({ avatar_path: path }).eq("id", user.id).select("id").maybeSingle();
      saved = !error && !!data;
    } catch {
      // A failed database request must not leave an unreferenced upload behind.
    }
    if (!saved) {
      await deleteAvatarFile(supabase, path, user.id);
      return { error: "La photo n’a pas pu être enregistrée. Votre photo précédente est conservée." };
    }
    await deleteAvatarFile(supabase, profile.avatar_path, user.id);
    revalidatePath("/", "layout");
    return { success: "Votre photo de profil a été enregistrée.", avatarPath: path };
  } catch {
    return { error: "La photo n’a pas pu être enregistrée. Réessayez." };
  }
}

export async function removeAvatar(): Promise<AvatarState> {
  const user = await requireUser("/profile");
  try {
    const profile = await ensureProfile();
    const supabase = await createClient();
    const { data, error } = await supabase.from("profiles")
      .update({ avatar_path: null }).eq("id", user.id).select("id").maybeSingle();
    if (error || !data) return { error: "La photo n’a pas pu être supprimée. Réessayez." };
    await deleteAvatarFile(supabase, profile.avatar_path, user.id);
    revalidatePath("/", "layout");
    return { success: "Votre photo de profil a été supprimée.", avatarPath: null };
  } catch {
    return { error: "La photo n’a pas pu être supprimée. Réessayez." };
  }
}
