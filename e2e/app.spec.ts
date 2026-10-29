import { test, expect } from "@playwright/test";

test("accueil français, navigation et affichage responsive", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Une idée.",
  );
  await expect(
    page.getByRole("link", { name: "Explorer les post-it", exact: true }),
  ).toBeVisible();
  expect(
    await page
      .locator(".hero-actions .button")
      .first()
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
  ).toBeGreaterThanOrEqual(14);
  expect(
    await page
      .locator(".nav-create")
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
  ).toBeGreaterThanOrEqual(14);
  await expect(
    page.getByRole("link", { name: "Administration", exact: true }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath("accueil.png"),
    fullPage: true,
  });
  await page
    .getByRole("link", { name: "Explorer les post-it", exact: true })
    .click();
  await expect(page).toHaveURL(/\/explore$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "inspiration",
  );
  expect(errors).toEqual([]);
});
test("les routes d'écriture exigent une connexion", async ({ page }) => {
  for (const path of [
    "/dashboard",
    "/notes/new",
    "/profile",
    "/admin",
    "/notes/aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa/edit",
  ]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login\?next=/);
    await expect(page.getByLabel("Adresse email")).toBeVisible();
  }
});
test("sans Supabase, état explicite et recherche fonctionnelle sans fausses notes", async ({
  page,
}) => {
  await page.goto("/explore");
  await expect(page.getByText("Votre atelier est presque prêt.")).toBeVisible();
  await expect(page.locator(".note-card")).toHaveCount(0);
  await page.getByRole("searchbox").fill('idée, titre " test');
  await page.getByRole("button", { name: "Rechercher" }).click();
  await expect(
    page.getByRole("heading", { name: "Cette idée se fait encore discrète." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("formulaire d'inscription et erreur de configuration accessible", async ({
  page,
}) => {
  await page.goto("/signup");
  await page.getByLabel("Adresse email").fill("alice@example.test");
  await page
    .getByLabel("Mot de passe", { exact: true })
    .fill("Une phrase de test sûre 2026");
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "connexion à Supabase" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /Google/i })).toHaveCount(0);
});
test("les liens invalides n'exposent aucune donnée et les réponses sont privées", async ({
  page,
  request,
}) => {
  await page.goto("/notes/aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa");
  await expect(
    page.getByRole("heading", { name: "Ce petit coin est vide." }),
  ).toBeVisible();
  const response = await request.get("/explore");
  expect(response.headers()["cache-control"]).toContain("no-store");
  expect(response.headers()["cache-control"]).toContain("private");
  const callback = await request.get(
    "/auth/confirm?token_hash=invalid&type=admin",
    { maxRedirects: 0 },
  );
  expect(callback.headers().location).toContain("/login?error=callback");
});
