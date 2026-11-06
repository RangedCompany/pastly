import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import { isSupabaseConfigured } from "./env";

// Verify the JWT locally (JWKS is cached), without fetching /auth/v1/user.
// Database policies remain authoritative for every read and mutation.
export const getIdentity = cache(async () => {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims.sub) return null;
  return { id: data.claims.sub };
});

export const getUser = cache(async () => {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
});
export async function requireIdentity(next = "/dashboard") {
  const identity = await getIdentity();
  if (!identity) redirect(`/login?next=${encodeURIComponent(next)}`);
  return identity;
}
export async function requireUser(next = "/dashboard") {
  const user = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}
