import { test, expect } from "@playwright/test";

for (const [path, next] of [
  ["/login?next=%2Fnotes%2Fnew", "/notes/new"],
  ["/signup", "/profile?welcome=1"],
]) {
  test(`Google depuis ${path} : départ PKCE et annulation`, async ({
    page,
    context,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route("https://google-auth-test.supabase.co/**", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: "<!doctype html><title>OAuth intercepté pour le test</title>",
      }),
    );
    await page.goto(path);
    await expect(
      page.getByRole("button", { name: "Continuer avec Google" }),
    ).toBeVisible();
    await expect(page.getByLabel("Adresse email")).toHaveValue("");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: info.outputPath("google.png"),
      fullPage: true,
    });

    // Empty required email/password fields must not block the separate Google form.
    await page.getByRole("button", { name: "Continuer avec Google" }).click();
    await page.waitForURL(
      "https://google-auth-test.supabase.co/auth/v1/authorize?**",
    );
    const authorize = new URL(page.url());
    expect(authorize.searchParams.get("provider")).toBe("google");
    expect(authorize.searchParams.get("code_challenge_method")).toBe("s256");
    expect(authorize.searchParams.get("code_challenge")).toBeTruthy();
    const callback = new URL(authorize.searchParams.get("redirect_to")!);
    expect(callback.origin + callback.pathname).toBe(
      "http://127.0.0.1:3102/auth/callback",
    );
    expect(callback.searchParams.get("flow")).toBe("google");
    expect(callback.searchParams.get("next")).toBe(next);
    const cookies = await context.cookies("http://127.0.0.1:3102");
    expect(
      cookies.some(
        (cookie) =>
          cookie.name.includes("code-verifier") && Boolean(cookie.value),
      ),
    ).toBe(true);

    // Simulate only the provider's refusal; no Google consent/session is fabricated.
    callback.searchParams.set("error", "access_denied");
    await page.goto(callback.toString());
    await expect(
      page.getByRole("alert").filter({ hasText: "connexion Google" }),
    ).toContainText("connexion Google a été annulée");
    await expect(
      page.getByRole("button", { name: "Continuer avec Google" }),
    ).toBeEnabled();
    await expect(page.getByLabel("Adresse email")).toBeVisible();
    expect(errors).toEqual([]);
  });
}
