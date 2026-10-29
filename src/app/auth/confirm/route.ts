import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
// Les modèles d'email documentés utilisent un token_hash pour fonctionner aussi sur un autre appareil.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const token_hash = url.searchParams.get("token_hash"),
    type = url.searchParams.get("type");
  if (
    token_hash &&
    (type === "email" || type === "recovery") &&
    isSupabaseConfigured()
  ) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (!error) {
      const response = NextResponse.redirect(
        new URL(
          type === "recovery" ? "/reset-password" : "/profile?welcome=1",
          request.url,
        ),
      );
      response.headers.set("Cache-Control", "private, no-store");
      response.headers.set("Referrer-Policy", "no-referrer");
      return response;
    }
  }
  return NextResponse.redirect(new URL("/login?error=callback", request.url));
}
