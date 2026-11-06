import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

// Runs only through playwright.live.config.ts, which requires an explicitly confirmed test project.
test("parcours V2 connecté : brouillon, sauvegarde privée, réouverture, édition, filtres et partage", async ({
  browser,
}, info) => {
  const env = process.env;
  const api = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
  const auth = await api.auth.signInWithPassword({
    email: env.PASTLY_TEST_USER_A_EMAIL!,
    password: env.PASTLY_TEST_USER_A_PASSWORD!,
  });
  expect(auth.error).toBeNull();
  const owner = auth.data.user!.id;
  const title = `V2 JSON ${crypto.randomUUID()}`;
  const original = '  {\n  "projet": "Pastly V2",\n  "prive": true\n}  \n';
  const edited = original.replace("Pastly V2", "Pastly révisé");
  const ownerContext = await browser.newContext(info.project.use);
  const thirdContext = await browser.newContext(info.project.use);
  const anonContext = await browser.newContext(info.project.use);
  const page = await ownerContext.newPage(),
    third = await thirdContext.newPage(),
    visitor = await anonContext.newPage();
  try {
    await page.goto("/");
    await page.locator("#viewer-source").fill(original);
    await expect(page.locator('input[name="format"]')).toHaveValue(
      "json",
    );
    await page
      .getByRole("button", { name: "Sauvegarder", exact: true })
      .click();
    await page
      .getByRole("link", { name: "Se connecter pour sauvegarder" })
      .click();
    await page.getByLabel("Adresse email").fill(env.PASTLY_TEST_USER_A_EMAIL!);
    await page
      .getByLabel("Mot de passe", { exact: true })
      .fill(env.PASTLY_TEST_USER_A_PASSWORD!);
    await page
      .getByRole("button", { name: "Se connecter", exact: true })
      .click();
    await expect(page).toHaveURL(/\?draft=1$/);
    await expect(page.locator("#viewer-source")).toHaveValue(original);
    await expect(page.getByRole("radio", { name: /Privé/ })).toBeChecked();
    await page.getByLabel("Titre", { exact: true }).fill(title);
    await page
      .getByRole("button", { name: "Enregistrer dans ma bibliothèque" })
      .click();
    await expect(page).toHaveURL(/\/dashboard\?success=saved/);
    await page.getByLabel("Filtrer par format").selectOption("json");
    await page.getByRole("searchbox").fill(title);
    await page.getByRole("button", { name: "Rechercher", exact: true }).click();
    const card = page
      .locator(".note-card")
      .filter({ has: page.getByRole("heading", { name: title, exact: true }) });
    await expect(card).toHaveClass(/document-card/);
    await expect(card.locator(".format-badge")).toHaveText("JSON");
    await card.locator(".note-card-link").click();
    const path = new URL(page.url()).pathname,
      id = path.split("/").pop()!;
    await expect(page.locator(".structured-view")).toContainText("Pastly V2");
    const saved = await api
      .from("notes")
      .select("content,format,content_kind,is_public")
      .eq("id", id)
      .single();
    expect(saved.error).toBeNull();
    expect(saved.data).toEqual({
      content: original,
      format: "json",
      content_kind: "data",
      is_public: false,
    });
    await visitor.goto(path);
    await expect(
      visitor.getByRole("heading", { name: "Ce petit coin est vide." }),
    ).toBeVisible();
    await third.goto("/login");
    await third.getByLabel("Adresse email").fill(env.PASTLY_TEST_USER_B_EMAIL!);
    await third
      .getByLabel("Mot de passe", { exact: true })
      .fill(env.PASTLY_TEST_USER_B_PASSWORD!);
    await third
      .getByRole("button", { name: "Se connecter", exact: true })
      .click();
    await expect(third).toHaveURL(/\/dashboard/);
    await third.goto(`${path}/edit`);
    await expect(
      third.getByRole("heading", { name: "Ce petit coin est vide." }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Modifier", exact: true }).click();
    await page.getByRole("button", { name: "Divisé", exact: true }).click();
    await page.locator("#viewer-source").fill(edited);
    await page
      .getByRole("button", { name: "Enregistrer dans ma bibliothèque" })
      .click();
    await expect(page).toHaveURL(/\/dashboard\?success=saved/);
    await page.goto(path);
    await expect(page.locator(".structured-view")).toContainText(
      "Pastly révisé",
    );
    await page
      .getByRole("button", { name: "Rendre ce contenu public", exact: true })
      .click();
    await expect(
      page.getByRole("button", {
        name: "Rendre ce contenu privé",
        exact: true,
      }),
    ).toBeVisible();
    await visitor.goto(path);
    await expect(visitor.locator(".structured-view")).toContainText(
      "Pastly révisé",
    );
    await visitor.goto(`/explore?format=json&q=${encodeURIComponent(title)}`);
    await expect(
      visitor.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Rendre ce contenu privé", exact: true })
      .click();
    await visitor.goto(path);
    await expect(
      visitor.getByRole("heading", { name: "Ce petit coin est vide." }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: `Supprimer « ${title} »`, exact: true })
      .click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Supprimer", exact: true })
      .click();
    await expect(page).toHaveURL(/\/dashboard\?success=deleted/);
  } finally {
    const cleanup = await api
      .from("notes")
      .delete()
      .eq("owner_id", owner)
      .eq("title", title);
    await Promise.all([
      ownerContext.close(),
      thirdContext.close(),
      anonContext.close(),
    ]);
    await api.auth.signOut({ scope: "local" });
    expect(cleanup.error).toBeNull();
  }
});
