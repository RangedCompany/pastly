import { test, expect } from "@playwright/test";
import { LANGUAGE_NAMES } from "../src/lib/i18n/locale";
import { readFileSync } from "node:fs";
const catalog = (locale: string): Record<string, string> =>
  JSON.parse(
    readFileSync(
      new URL(`../src/lib/i18n/messages/${locale}.json`, import.meta.url),
      "utf8",
    ),
  );
const en = catalog("en"),
  es = catalog("es");

test.describe("browser locale", () => {
  test.use({ locale: "es-MX" });

  test("server and client render the preferred language, including legal pages without JS", async ({
    page,
    browser,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const response = await page.goto("/");
    expect(response?.headers()["content-language"]).toBe("es");
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
    await expect(
      page.getByRole("button", { name: es["Ouvrir un fichier"], exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: es.Connexion, exact: true }),
    ).toBeVisible();
    await page.getByRole("link", { name: es.Connexion, exact: true }).click();
    await expect(page.getByLabel(es["Adresse email"])).toBeVisible();
    expect(errors).toEqual([]);

    const context = await browser.newContext({
      javaScriptEnabled: false,
      locale: "en-GB",
    });
    const legal = await context.newPage();
    await legal.goto("/privacy");
    await expect(legal.locator("html")).toHaveAttribute("lang", "en");
    await expect(legal.getByRole("heading", { level: 1 })).toHaveText(
      en["Politique de confidentialité"],
    );
    await expect(legal.locator(".legal-content section")).toHaveCount(10);
    await context.close();
  });

  test("manual choice survives navigation and reload without losing the open document", async ({
    page,
    context,
  }) => {
    await page.goto("/");
    const source = page.locator("#viewer-source");
    const content = "Mon profil\nConfidentialité\n<script>text only</script>";
    await source.fill(content);
    await page.locator(".language-picker select").selectOption("en");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(source).toHaveValue(content);
    await expect(
      page.getByRole("button", { name: en["Ouvrir un fichier"], exact: true }),
    ).toBeVisible();
    expect(
      (await context.cookies()).find(
        (cookie) => cookie.name === "pastly-locale",
      )?.value,
    ).toBe("en");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await page.goto("/terms");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      en["Conditions générales d’utilisation"],
    );
  });
});

test("every available language renders and fits the viewport", async ({
  page,
}) => {
  await page.goto("/");
  for (const [locale, name] of Object.entries(LANGUAGE_NAMES)) {
    await page.locator(".language-picker select").selectOption({ label: name });
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.locator(".language-picker select")).toHaveValue(locale);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
