import "server-only";
import { createClient } from "./supabase/server";
import { NOTE_FIELDS, PAGE_SIZE, PROFILE_FIELDS } from "./constants";
import { searchFilter } from "./validation";
import type { NoteWithAuthor } from "./database.types";

export async function listNotes({
  page = 1,
  query = "",
  owner,
  visibility = "public",
}: {
  page?: number;
  query?: string;
  owner?: string;
  visibility?: string;
}) {
  const supabase = await createClient();
  let request = supabase.from("notes").select(NOTE_FIELDS, { count: "exact" });
  if (owner) request = request.eq("owner_id", owner);
  if (visibility === "public") request = request.eq("is_public", true);
  if (visibility === "private") request = request.eq("is_public", false);
  if (query) request = request.or(searchFilter(query));
  const { data, error, count } = await request
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (error)
    throw new Error(
      "Impossible de charger les post-it. Réessayez dans un instant.",
    );
  return { notes: data as NoteWithAuthor[], count: count ?? 0 };
}
export async function getNote(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notes")
    .select(NOTE_FIELDS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("Impossible de charger ce post-it.");
  return data as NoteWithAuthor | null;
}
export async function getProfile(username: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_FIELDS)
    .eq("username", username)
    .maybeSingle();
  if (error) throw new Error("Impossible de charger ce profil.");
  return data;
}
export async function ensureProfile() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("ensure_my_profile");
  if (error)
    throw new Error(
      "Impossible de préparer votre profil. Réessayez dans un instant.",
    );
  return data;
}
