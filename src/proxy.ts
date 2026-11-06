import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured, supabaseEnv } from "@/lib/env";
import { LOCALE_COOKIE, resolveLocale } from "@/lib/i18n/locale";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (
    isSupabaseConfigured() &&
    request.cookies
      .getAll()
      .some(({ name }) => name.startsWith("sb-") && name.includes("auth-token"))
  ) {
    const { url, key } = supabaseEnv();
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(values) {
          values.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          values.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });
    await supabase.auth.getClaims();
  }
  response.headers.set(
    "Cache-Control",
    "private, no-store, max-age=0, must-revalidate",
  );
  response.headers.set(
    "Content-Language",
    resolveLocale(
      request.cookies.get(LOCALE_COOKIE)?.value,
      request.headers.get("accept-language") ?? "",
    ),
  );
  return response;
}
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
