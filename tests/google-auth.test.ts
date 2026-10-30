import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  oauth: vi.fn(),
  exchange: vi.fn(),
  createClient: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { signInWithGoogle } from "../src/app/actions/auth";
import { GET } from "../src/app/auth/callback/route";
import { isGoogleAuthEnabled } from "../src/lib/env";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://pastly.fr");
  vi.stubEnv("NEXT_PUBLIC_GOOGLE_AUTH_ENABLED", "true");
  mocks.createClient.mockResolvedValue({
    auth: {
      signInWithOAuth: mocks.oauth,
      exchangeCodeForSession: mocks.exchange,
    },
  });
  mocks.oauth.mockResolvedValue({
    data: { url: "https://project.supabase.co/auth/v1/authorize" },
    error: null,
  });
  mocks.exchange.mockResolvedValue({ error: null });
});
afterEach(() => vi.unstubAllEnvs());

describe("démarrage Google", () => {
  it.each(["false", "", "TRUE"])(
    "refuse l'action si l'option vaut %s",
    async (flag) => {
      vi.stubEnv("NEXT_PUBLIC_GOOGLE_AUTH_ENABLED", flag);
      expect(isGoogleAuthEnabled()).toBe(false);
      expect(await signInWithGoogle({}, new FormData())).toHaveProperty(
        "error",
      );
      expect(mocks.createClient).not.toHaveBeenCalled();
    },
  );
  it("reste désactivé sans Supabase", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    expect(isGoogleAuthEnabled()).toBe(false);
    expect(await signInWithGoogle({}, new FormData())).toHaveProperty("error");
    expect(mocks.createClient).not.toHaveBeenCalled();
  });
  it.each([
    "/notes/new",
    "/profile?welcome=1",
    "/dashboard?q=idée&visibility=private",
  ])("conserve la destination %s", async (next) => {
    const form = new FormData();
    form.set("next", next);
    await expect(signInWithGoogle({}, form)).rejects.toThrow(
      "redirect:https://project.supabase.co/auth/v1/authorize",
    );
    const options = mocks.oauth.mock.calls[0][0];
    expect(options.provider).toBe("google");
    expect(options.options.scopes).toBe("openid email profile");
    const callback = new URL(options.options.redirectTo);
    expect(callback.origin + callback.pathname).toBe(
      "https://pastly.fr/auth/callback",
    );
    expect(callback.searchParams.get("flow")).toBe("google");
    const destination = new URL(next, "https://pastly.fr");
    expect(callback.searchParams.get("next")).toBe(
      destination.pathname + destination.search,
    );
  });
  it.each(["https://evil.example", "//evil.example", "/%5cevil.example"])(
    "refuse la destination externe %s",
    async (next) => {
      const form = new FormData();
      form.set("next", next);
      await expect(signInWithGoogle({}, form)).rejects.toThrow("redirect:");
      const callback = new URL(mocks.oauth.mock.calls[0][0].options.redirectTo);
      expect(callback.searchParams.get("next")).toBe("/dashboard");
    },
  );
  it.each([
    { data: { url: null }, error: { message: "secret provider detail" } },
    { data: { url: null }, error: null },
  ])(
    "affiche une erreur générique quand le fournisseur est indisponible",
    async (result) => {
      mocks.oauth.mockResolvedValue(result);
      const state = await signInWithGoogle({}, new FormData());
      expect(state.error).toContain("indisponible");
      expect(state.error).not.toContain("secret");
      expect(mocks.redirect).not.toHaveBeenCalled();
    },
  );
  it("gère une coupure réseau", async () => {
    mocks.oauth.mockRejectedValue(new Error("network detail"));
    expect(await signInWithGoogle({}, new FormData())).toHaveProperty("error");
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});

describe("callback PKCE", () => {
  function callback(query: string) {
    return GET(new NextRequest(`https://pastly.fr/auth/callback?${query}`));
  }
  it.each(["/notes/new", "/profile?welcome=1"])(
    "échange le code et redirige vers %s",
    async (next) => {
      const response = await callback(
        `code=valid&flow=google&next=${encodeURIComponent(next)}`,
      );
      expect(mocks.exchange).toHaveBeenCalledWith("valid");
      expect(response.headers.get("location")).toBe(`https://pastly.fr${next}`);
      expect(response.headers.get("cache-control")).toBe("private, no-store");
      expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    },
  );
  it("conserve le parcours de confirmation email existant", async () => {
    const response = await callback("code=email-code");
    expect(response.headers.get("location")).toBe(
      "https://pastly.fr/profile?welcome=1",
    );
  });
  it("neutralise une redirection externe", async () => {
    const response = await callback("code=valid&next=https://evil.example");
    expect(response.headers.get("location")).toBe(
      "https://pastly.fr/profile?welcome=1",
    );
  });
  it("traite une annulation sans échanger de code ni refléter les détails", async () => {
    const response = await callback(
      "flow=google&error=access_denied&error_description=SECRET&code=ignored&next=%2Fnotes%2Fnew",
    );
    const location = new URL(response.headers.get("location")!);
    expect(location.searchParams.get("error")).toBe("google-cancelled");
    expect(location.searchParams.get("next")).toBe("/notes/new");
    expect(location.href).not.toContain("SECRET");
    expect(mocks.exchange).not.toHaveBeenCalled();
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
  });
  it("traite un code expiré", async () => {
    mocks.exchange.mockResolvedValue({ error: { message: "expired" } });
    const response = await callback(
      "code=expired&flow=google&next=%2Fnotes%2Fnew",
    );
    expect(
      new URL(response.headers.get("location")!).searchParams.get("error"),
    ).toBe("google");
  });
  it("gère une coupure réseau pendant l’échange sans exposer les détails", async () => {
    mocks.exchange.mockRejectedValueOnce(new Error("PRIVATE_NETWORK_DETAIL"));
    const response = await callback("code=valid&flow=google");
    expect(
      new URL(response.headers.get("location")!).searchParams.get("error"),
    ).toBe("google");
    expect(response.headers.get("location")).not.toContain(
      "PRIVATE_NETWORK_DETAIL",
    );
  });
  it("refuse un code absent et conserve l'erreur email existante", async () => {
    const response = await callback("");
    expect(response.headers.get("location")).toBe(
      "https://pastly.fr/login?error=callback",
    );
    expect(mocks.exchange).not.toHaveBeenCalled();
  });
});
