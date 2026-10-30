import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { safeNext } from "@/lib/validation";

function redirectTo(path: string, request: NextRequest) {
  const response = NextResponse.redirect(new URL(path, request.url));
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const isGoogle = url.searchParams.get("flow") === "google";
  const failure = (cancelled = false) => {
    const destination = new URL("/login", request.url);
    destination.searchParams.set(
      "error",
      isGoogle ? (cancelled ? "google-cancelled" : "google") : "callback",
    );
    if (isGoogle)
      destination.searchParams.set(
        "next",
        safeNext(url.searchParams.get("next")),
      );
    return redirectTo(destination.pathname + destination.search, request);
  };
  if (url.searchParams.has("error"))
    return failure(url.searchParams.get("error") === "access_denied");
  if (code && isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return redirectTo(
          safeNext(url.searchParams.get("next"), "/profile?welcome=1"),
          request,
        );
      }
    } catch {
      return failure();
    }
  }
  return failure();
}
