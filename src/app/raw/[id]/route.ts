import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { idSchema } from "@/lib/validation";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const headers = {
    "Content-Type": "text/plain; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; sandbox",
    "Cache-Control": "private, no-store",
    "X-Robots-Tag": "noindex, nofollow",
  };
  const { id } = await params;
  if (!isSupabaseConfigured() || !idSchema.safeParse(id).success)
    return new Response("Contenu introuvable.", { status: 404, headers });
  const supabase = await createClient();
  // The cookie-scoped client applies the same RLS as the note page, including private notes.
  const { data, error } = await supabase.from("notes").select("content").eq("id", id).maybeSingle();
  if (error) return new Response("Lecture impossible.", { status: 503, headers });
  if (!data) return new Response("Contenu introuvable.", { status: 404, headers });
  return new Response(data.content, { headers });
}
