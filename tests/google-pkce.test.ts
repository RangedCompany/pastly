import { afterEach, expect, it, vi } from "vitest";

const store = vi.hoisted(() => ({ getAll: vi.fn(() => []), set: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: async () => store }));

import { createClient } from "../src/lib/supabase/server";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

it("le vrai client SSR génère un challenge PKCE et écrit le cookie vérificateur avant la redirection", async () => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
  const client = await createClient();
  const { data, error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo:
        "https://pastly.fr/auth/callback?flow=google&next=%2Fnotes%2Fnew",
    },
  });
  expect(error).toBeNull();
  const authorize = new URL(data.url!);
  expect(authorize.origin + authorize.pathname).toBe(
    "https://project.supabase.co/auth/v1/authorize",
  );
  expect(authorize.searchParams.get("provider")).toBe("google");
  expect(authorize.searchParams.get("code_challenge_method")).toBe("s256");
  expect(authorize.searchParams.get("code_challenge")).toBeTruthy();
  expect(
    store.set.mock.calls.some(
      ([name, value]) =>
        String(name).includes("code-verifier") && Boolean(value),
    ),
  ).toBe(true);
});
