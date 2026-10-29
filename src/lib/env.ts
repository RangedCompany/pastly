export function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return Boolean(
    url && key && !url.includes("votre-projet") && !key.includes("votre_cle"),
  );
}
export function supabaseEnv() {
  if (!isSupabaseConfigured())
    throw new Error("Supabase n’est pas configuré. Consultez le README.");
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  };
}
export function siteUrl() {
  const value = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return new URL(value).origin;
}
