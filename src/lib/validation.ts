import { z } from "zod";
import { COLORS } from "./constants";

export const noteSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Ajoutez un titre.")
    .max(120, "Le titre est limité à 120 caractères."),
  content: z
    .string()
    .trim()
    .min(1, "Votre post-it est encore vide.")
    .max(5000, "Le contenu est limité à 5 000 caractères."),
  color: z.enum(COLORS, { error: "Choisissez une couleur proposée." }),
  is_public: z.boolean(),
});
export const profileSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Au moins 3 caractères pour le nom d’utilisateur.")
    .max(40)
    .regex(
      /^[a-z0-9_]+$/,
      "Utilisez des lettres minuscules, chiffres et tirets bas.",
    ),
  display_name: z
    .string()
    .trim()
    .min(1, "Ajoutez un nom affiché.")
    .max(80, "Le nom est limité à 80 caractères."),
});
export const emailSchema = z
  .email("Cette adresse email ne semble pas valide.")
  .max(254);
export const passwordSchema = z
  .string()
  .min(12, "Utilisez au moins 12 caractères.")
  .max(128, "Le mot de passe est limité à 128 caractères.");
export const idSchema = z.uuid();

// A redirect must stay on this application, including after URL decoding.
export function safeNext(value: unknown, fallback = "/dashboard"): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//")
  )
    return fallback;
  try {
    const decoded = decodeURIComponent(value);
    if (/[\\\r\n\u0000]/.test(decoded) || decoded.startsWith("//"))
      return fallback;
    const url = new URL(value, "https://pastly.invalid");
    return url.origin === "https://pastly.invalid"
      ? url.pathname + url.search
      : fallback;
  } catch {
    return fallback;
  }
}
export function parsePage(value: unknown) {
  const n = typeof value === "string" ? Number(value) : 1;
  return Number.isSafeInteger(n) && n > 0 ? Math.min(n, 10000) : 1;
}
export function searchTerm(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 100) : "";
}
// Escape PostgREST OR grammar and LIKE wildcards. SQL remains parameterized by PostgREST.
export function searchFilter(value: string) {
  const escaped = value
    .replace(/\\/g, "\\\\")
    .replace(/[%_]/g, "\\$&")
    .replace(/"/g, '\\"');
  return `title.ilike."%${escaped}%",content.ilike."%${escaped}%"`;
}
export type ActionState = { error?: string; success?: string };
