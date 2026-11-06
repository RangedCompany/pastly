export const AVATAR_BUCKET = "avatars";
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
export const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function avatarUrl(path?: string | null) {
  const origin = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!origin || !path || !/^[a-f0-9-]{36}\/[a-f0-9-]{36}\.webp$/.test(path))
    return null;
  return `${origin.replace(/\/$/, "")}/storage/v1/object/public/${AVATAR_BUCKET}/${path}`;
}
