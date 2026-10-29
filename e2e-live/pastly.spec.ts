import { test, expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const env = process.env;
async function login(page: Page, account: "A" | "B") {
  await page.goto("/login");
  await page
    .getByLabel("Adresse email")
    .fill(env[`PASTLY_TEST_USER_${account}_EMAIL`]!);
  await page
    .getByLabel("Mot de passe", { exact: true })
    .fill(env[`PASTLY_TEST_USER_${account}_PASSWORD`]!);
  await page.getByRole("button", { name: "Se connecter", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test("parcours réel : profil, publication, partage, confidentialité, édition et suppression", async ({
  browser,
}, info) => {
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
  expect(auth.error, "Le compte A doit pouvoir se connecter").toBeNull();
  const owner = auth.data.user!.id;
  const original = await api
    .from("profiles")
    .select("username,display_name")
    .eq("id", owner)
    .single();
  expect(original.error).toBeNull();
  const suffix = crypto.randomUUID().slice(0, 8);
  const title = `Pastly ${suffix} — idée "100%_été", test`;
  const updatedTitle = `${title} révisé`;
  const username = `pastly_test_${suffix}`;
  const displayName = `Membre test ${suffix}`;
  const contextOptions = info.project.use;
  const aContext = await browser.newContext({
    ...contextOptions,
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const bContext = await browser.newContext(contextOptions);
  const anonContext = await browser.newContext(contextOptions);
  for (const context of [aContext, bContext, anonContext]) {
    context.setDefaultTimeout(15000);
    context.setDefaultNavigationTimeout(20000);
  }
  const a = await aContext.newPage(),
    b = await bContext.newPage(),
    visitor = await anonContext.newPage();
  try {
    await visitor.goto("/notes/new");
    await expect(visitor).toHaveURL(/\/login\?next=/);
    await login(a, "A");
    await a.reload();
    await expect(a.getByRole("heading", { level: 1 })).toHaveText(
      "Mes petites idées.",
    );
    await a.goto("/profile");
    await a.getByLabel("Nom affiché", { exact: true }).fill(displayName);
    await a.getByLabel("Nom d’utilisateur", { exact: true }).fill(username);
    await a.getByRole("button", { name: "Enregistrer le profil" }).click();
    await expect(
      a.getByText("Votre profil a bien été enregistré."),
    ).toBeVisible();
    await a.goto("/notes/new");
    await expect(a.getByRole("radio", { name: /Public/ })).toBeChecked();
    await a.getByLabel("Titre du post-it").fill(title);
    await a
      .getByLabel("Contenu du post-it")
      .fill(`Contenu de contrôle ${suffix}. Une idée privée reste protégée.`);
    await a.getByTitle("Bleu ciel", { exact: true }).click();
    await expect(
      a.getByRole("radio", { name: "Bleu ciel", exact: true }),
    ).toBeChecked();
    await a.getByRole("button", { name: "Enregistrer le post-it" }).click();
    await expect(a).toHaveURL(/\/dashboard\?success=saved/);
    let card = a
      .locator(".note-card")
      .filter({ has: a.getByRole("heading", { name: title, exact: true }) });
    await expect(card).toHaveClass(/paper-blue/);
    await card.locator(".note-card-link").click();
    await expect(a).toHaveURL(/\/notes\/[0-9a-f-]{36}$/);
    const notePath = new URL(a.url()).pathname;
    await a.getByRole("button", { name: "Copier le lien du post-it" }).click();
    await expect(a.getByText("Lien copié !", { exact: true })).toBeVisible();
    expect(await a.evaluate(() => navigator.clipboard.readText())).toBe(
      a.url(),
    );
    await visitor.goto(notePath);
    await expect(
      visitor.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
    await expect(
      visitor.getByRole("link", { name: displayName, exact: true }),
    ).toBeVisible();
    await visitor.goto("/explore");
    await visitor.getByRole("searchbox").fill("100%_été");
    await visitor
      .getByRole("button", { name: "Rechercher", exact: true })
      .click();
    await expect(
      visitor.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
    await visitor.goto(`/u/${username}`);
    await expect(
      visitor.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
    const profileResponse = await visitor.request.get(`/u/${username}`);
    expect(await profileResponse.text()).not.toContain(
      env.PASTLY_TEST_USER_A_EMAIL!,
    );
    await login(b, "B");
    await b.goto(`${notePath}/edit`);
    await expect(
      b.getByRole("heading", { name: "Ce petit coin est vide." }),
    ).toBeVisible();
    await a
      .getByRole("button", { name: "Rendre ce post-it privé", exact: true })
      .click();
    await expect(
      a.getByText("Privé · visible par vous uniquement", { exact: true }),
    ).toBeVisible();
    await expect(
      a.getByRole("button", { name: "Copier le lien du post-it" }),
    ).toHaveCount(0);
    for (const page of [visitor, b]) {
      await page.goto(notePath);
      await expect(
        page.getByRole("heading", { name: "Ce petit coin est vide." }),
      ).toBeVisible();
      await expect(
        page.getByText(`Contenu de contrôle ${suffix}`, { exact: false }),
      ).toHaveCount(0);
    }
    await visitor.goto(`/explore?q=${suffix}`);
    await expect(
      visitor.getByRole("heading", { name: title, exact: true }),
    ).toHaveCount(0);
    await visitor.goto(`/u/${username}`);
    await expect(
      visitor.getByRole("heading", { name: title, exact: true }),
    ).toHaveCount(0);
    await a.goto("/dashboard?visibility=private");
    card = a
      .locator(".note-card")
      .filter({ has: a.getByRole("heading", { name: title, exact: true }) });
    await expect(card).toBeVisible();
    await card
      .getByRole("link", { name: `Modifier « ${title} »`, exact: true })
      .click();
    await a.getByLabel("Titre du post-it").fill(updatedTitle);
    await a.getByTitle("Vert sauge", { exact: true }).click();
    await expect(
      a.getByRole("radio", { name: "Vert sauge", exact: true }),
    ).toBeChecked();
    await a.getByRole("button", { name: "Enregistrer le post-it" }).click();
    await expect(a).toHaveURL(/\/dashboard\?success=saved/);
    card = a.locator(".note-card").filter({
      has: a.getByRole("heading", { name: updatedTitle, exact: true }),
    });
    await expect(card).toHaveClass(/paper-green/);
    await card
      .getByRole("button", { name: "Rendre ce post-it public", exact: true })
      .click();
    await expect(
      card.getByRole("button", {
        name: "Rendre ce post-it privé",
        exact: true,
      }),
    ).toBeVisible();
    const headingBox = await card
      .getByRole("heading", { name: updatedTitle, exact: true })
      .boundingBox();
    const statusBox = await card.getByRole("status").boundingBox();
    expect(headingBox).not.toBeNull();
    expect(statusBox).not.toBeNull();
    expect(statusBox!.y + statusBox!.height).toBeLessThanOrEqual(headingBox!.y);
    await visitor.goto(notePath);
    await expect(
      visitor.getByRole("heading", { name: updatedTitle, exact: true }),
    ).toBeVisible();
    await a.screenshot({
      path: info.outputPath("mes-notes.png"),
      fullPage: true,
    });
    await card
      .getByRole("button", {
        name: `Supprimer « ${updatedTitle} »`,
        exact: true,
      })
      .click();
    await a
      .getByRole("dialog")
      .getByRole("button", { name: "Annuler", exact: true })
      .click();
    await expect(card).toBeVisible();
    await card
      .getByRole("button", {
        name: `Supprimer « ${updatedTitle} »`,
        exact: true,
      })
      .click();
    await a
      .getByRole("dialog")
      .getByRole("button", { name: "Supprimer", exact: true })
      .click();
    await expect(a).toHaveURL(/\/dashboard\?success=deleted/);
    await expect(
      a.getByRole("heading", { name: updatedTitle, exact: true }),
    ).toHaveCount(0);
    await visitor.goto(notePath);
    await expect(
      visitor.getByRole("heading", { name: "Ce petit coin est vide." }),
    ).toBeVisible();
    await a.getByRole("button", { name: "Déconnexion", exact: true }).click();
    await expect(a).toHaveURL("/");
    await a.goto("/dashboard");
    await expect(a).toHaveURL(/\/login\?next=/);
  } finally {
    // Les titres peuvent contenir guillemets et virgules : comparer côté JS,
    // puis supprimer par UUID pour éviter toute ambiguïté de grammaire PostgREST.
    const candidates = await api
      .from("notes")
      .select("id,title")
      .eq("owner_id", owner);
    expect(
      candidates.error,
      "Lecture des notes temporaires à nettoyer",
    ).toBeNull();
    const ids = candidates
      .data!.filter(
        (note) => note.title === title || note.title === updatedTitle,
      )
      .map((note) => note.id);
    if (ids.length) {
      const cleanup = await api
        .from("notes")
        .delete()
        .eq("owner_id", owner)
        .in("id", ids)
        .select("id");
      expect(cleanup.error, "Nettoyage des notes de test").toBeNull();
      expect(cleanup.data).toHaveLength(ids.length);
    }
    const restore = await api
      .from("profiles")
      .update(original.data!)
      .eq("id", owner)
      .select("username,display_name")
      .single();
    await Promise.all([
      aContext.close(),
      bContext.close(),
      anonContext.close(),
    ]);
    await api.auth.signOut({ scope: "local" });
    expect(restore.error, "Restauration du profil de test").toBeNull();
    expect(restore.data).toEqual(original.data);
  }
});
