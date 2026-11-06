export const COLORS = [
  "yellow",
  "pink",
  "blue",
  "green",
  "purple",
  "orange",
] as const;
export type NoteColor = (typeof COLORS)[number];
export const COLOR_LABELS: Record<NoteColor, string> = {
  yellow: "Jaune soleil",
  pink: "Rose poudré",
  blue: "Bleu ciel",
  green: "Vert sauge",
  purple: "Violet lavande",
  orange: "Orange pêche",
};
export const PAGE_SIZE = 12;
export const PROFILE_FIELDS = "id, username, display_name, avatar_path, created_at";
export const NOTE_FIELDS =
  "id, owner_id, title, content, color, is_public, content_kind, format, original_filename, metadata, created_at, updated_at, author:profiles!notes_owner_profile_fkey(id, username, display_name, avatar_path, created_at)";
