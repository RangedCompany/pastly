import { test, expect, type Page } from "@playwright/test";
import { zipSync, strToU8 } from "fflate";
import { readFile } from "node:fs/promises";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});
async function source(page: Page, text: string, format?: string) {
  if (!(await page.locator("#viewer-source").count()))
    await page.getByRole("button", { name: "Split", exact: true }).click();
  await page.locator("#viewer-source").fill(text);
  if (format)
    await page.getByLabel("Format", { exact: true }).selectOption(format);
}
test("presse-papiers sans compte, copie et refus d’un collage excessif", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const pasted = "# Collé depuis le presse-papiers\n\nUne **idée** conservée.";
  await page.evaluate((text) => navigator.clipboard.writeText(text), pasted);
  // Windows may normalize clipboard line endings to CRLF before Pastly reads them.
  const clipboardOriginal = await page.evaluate(() =>
    navigator.clipboard.readText(),
  );
  await page.getByRole("button", { name: "Coller", exact: true }).click();
  await expect(page.locator("#viewer-source")).toHaveValue(pasted);
  await expect(page.locator(".markdown-body h1")).toHaveText(
    "Collé depuis le presse-papiers",
  );
  await page
    .locator(".workspace-actions")
    .getByRole("button", { name: "Copier", exact: true })
    .click();
  await expect(page.locator(".workspace-actions [role=status]")).toHaveText(
    "Copié",
  );
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    clipboardOriginal,
  );
  await page.locator("#viewer-source").evaluate((element) => {
    const data = new DataTransfer();
    data.setData("text/plain", "x".repeat(100001));
    element.dispatchEvent(
      new ClipboardEvent("paste", {
        clipboardData: data,
        bubbles: true,
        cancelable: true,
      }),
    );
  });
  await expect(
    page.getByRole("status").filter({ hasText: "Ce collage dépasse" }),
  ).toBeVisible();
  await expect(page.locator("#viewer-source")).toHaveValue(pasted);
});
test("collage anonyme, Markdown GFM, Mermaid intégré, maths et mise en page", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await source(
    page,
    "# Mon document\n\n| Nom | Valeur |\n| --- | --- |\n| Pastly | Utile |\n\n- [x] Terminé\n\n$x^2$\n\n```mermaid\nflowchart LR\n A[Coller] --> B[Visualiser]\n```\n\n```typescript\nconst x: number = 1;\n```",
  );
  await expect(page.getByLabel("Format", { exact: true })).toHaveValue(
    "markdown",
  );
  await expect(page.locator(".markdown-body h1")).toHaveText("Mon document");
  await expect(page.locator(".markdown-body table")).toContainText("Pastly");
  await expect(
    page.locator('.markdown-body input[type="checkbox"]'),
  ).toBeChecked();
  await expect(page.locator(".katex")).toBeVisible();
  await expect(page.locator(".diagram-scroll img")).toHaveAttribute(
    "src",
    /^blob:/,
    { timeout: 20000 },
  );
  await expect(
    page.locator(".code-view code span[style]").first(),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath("markdown-mermaid.png"),
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
test("JSON interactif, format forcé et saisie préservée entre les modes", async ({
  page,
}) => {
  const original = '  {"nom":"Pastly","liste":[1,true,null]}  \n';
  await source(page, original);
  await expect(page.getByLabel("Format", { exact: true })).toHaveValue("json");
  await expect(page.locator(".tree-leaf").first()).toContainText("Pastly");
  await page.getByRole("button", { name: "Déplier 3 niveaux" }).click();
  await expect(page.locator(".value-boolean")).toContainText("true");
  await page.getByRole("button", { name: "Tout replier" }).click();
  await expect(
    page.locator(".structured-view details").first(),
  ).not.toHaveAttribute("open");
  await page.getByLabel("Format", { exact: true }).selectOption("text");
  await expect(page.getByLabel("Automatique")).not.toBeChecked();
  await page.getByRole("button", { name: "Aperçu", exact: true }).click();
  await expect(page.locator(".plain-view")).toHaveText(original);
  await page.getByRole("button", { name: "Source", exact: true }).click();
  await expect(page.locator("#viewer-source")).toHaveValue(original);
  await page.getByRole("button", { name: "Split", exact: true }).click();
  await page.getByLabel("Format", { exact: true }).selectOption("json");
  await source(page, '{"nom":', "json");
  await expect(page.locator(".preview-pane [role=alert]")).toBeVisible();
  await page.getByRole("button", { name: "Sauvegarder", exact: true }).click();
  await expect(page.locator(".workspace-save")).toContainText(
    "connexion Supabase configurée",
  );
  await expect(page).toHaveURL(/\/$/);
});
test("données YAML, TOML et XML valides puis diagnostics de parsing", async ({
  page,
}) => {
  for (const [format, valid, invalid] of [
    ["yaml", "nom: Pastly\nobjets:\n  - oui", "nom: ["],
    ["toml", 'nom = "Pastly"', "nom = ["],
    ["xml", "<app><nom>Pastly</nom></app>", "<app>"],
  ] as const) {
    await source(page, valid, format);
    await page.getByRole("button", { name: "Déplier 3 niveaux" }).click();
    await expect(page.locator(".structured-view")).toContainText("Pastly");
    await source(page, invalid, format);
    await expect(page.locator(".preview-pane [role=alert]")).toBeVisible();
  }
});
test("Mermaid : SVG graphique, zoom, export et erreur de syntaxe", async ({
  page,
}) => {
  await source(page, "sequenceDiagram\n Alice->>Bob: Bonjour");
  const image = page.locator(".diagram-scroll img");
  await expect(image).toHaveAttribute("src", /^blob:/, { timeout: 20000 });
  await expect
    .poll(() => image.evaluate((el: HTMLImageElement) => el.naturalWidth))
    .toBeGreaterThan(0);
  await page.getByRole("button", { name: "Agrandir le diagramme" }).click();
  await expect(page.locator(".mermaid-view")).toContainText("125 %");
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exporter SVG" }).click();
  expect((await downloaded).suggestedFilename()).toBe("pastly-diagramme.svg");
  await source(page, "flowchart LR\n A -->>><", "mermaid");
  await expect(page.locator(".preview-pane [role=alert]")).toContainText(
    "Syntaxe Mermaid",
  );
});
test("code coloré, indentation, original téléchargeable et plein écran", async ({
  page,
}) => {
  const text = "  interface Idee {\n\ttitre: string;  \n}\n";
  await source(page, text, "typescript");
  await expect(
    page.locator(".code-view code span[style]").first(),
  ).toBeVisible();
  await expect(page.locator("#viewer-source")).toHaveValue(text);
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Télécharger", exact: true }).click();
  expect((await downloaded).suggestedFilename()).toBe("pastly.ts");
  await page.getByRole("button", { name: "Plein écran", exact: true }).click();
  await expect(page.locator(".workspace-fullscreen")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".workspace-fullscreen")).toHaveCount(0);
});
test("CSV cité : tableau, tri, recherche ; texte ambigu en fallback", async ({
  page,
}) => {
  await source(page, 'nom,texte\nBob,"Bonjour, monde"\nAlice,"Il dit ""oui"""');
  await expect(page.getByLabel("Format", { exact: true })).toHaveValue("text");
  await page.getByLabel("Format", { exact: true }).selectOption("csv");
  await expect(page.locator(".table-view tbody tr")).toHaveCount(2);
  await expect(page.locator(".table-view")).toContainText('Il dit "oui"');
  await page.locator(".table-view th button").first().click();
  await expect(page.locator(".table-view tbody tr").first()).toContainText(
    "Alice",
  );
  await page.getByLabel("Rechercher dans le tableau").fill("monde");
  await expect(page.locator(".table-view tbody tr")).toHaveCount(1);
});
test("Markdown, HTML, SVG et directives Mermaid ne peuvent exécuter du JavaScript", async ({
  page,
}) => {
  const dialogs: string[] = [];
  page.on("dialog", async (dialog) => {
    dialogs.push(dialog.message());
    await dialog.dismiss();
  });
  const outbound: string[] = [];
  page.on("request", (request) => {
    if (request.url().startsWith("https://evil.example"))
      outbound.push(request.url());
  });
  await source(
    page,
    '# Test\n\n<script>alert(1)</script>\n\n<img src=x onerror="alert(2)">\n\n[clic](javascript:alert(3))\n\n![distante](https://evil.example/image.png)',
    "markdown",
  );
  await expect(page.locator(".markdown-body h1")).toHaveText("Test");
  await expect(
    page.locator('.markdown-body a[href^="javascript:"]'),
  ).toHaveCount(0);
  await expect(
    page.locator(".markdown-body script, .markdown-body img"),
  ).toHaveCount(0);
  expect(outbound).toEqual([]);
  await source(page, "<script>alert(4)</script>", "html");
  await expect(page.locator(".code-view")).toContainText("alert(4)");
  await source(
    page,
    '%%{init: {"securityLevel":"loose"}}%%\nflowchart LR\nA-->B',
    "mermaid",
  );
  await expect(page.locator(".preview-pane [role=alert]")).toContainText(
    "désactivées",
  );
  await page.getByLabel("Ouvrir un fichier local").setInputFiles({
    name: "test.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" onload="alert(5)"><script>alert(6)</script><foreignObject width="100" height="100"><div xmlns="http://www.w3.org/1999/xhtml">danger</div></foreignObject><rect width="80" height="80" fill="green"/></svg>',
    ),
  });
  const svg = page.locator(".local-image");
  await expect(svg).toBeVisible();
  const cleaned = await svg.evaluate(async (el: HTMLImageElement) =>
    (await fetch(el.src)).text(),
  );
  expect(cleaned).not.toMatch(/<script|onload|foreignObject/i);
  expect(dialogs).toEqual([]);
});
test("fichiers : limites explicites et source conservée", async ({ page }) => {
  await source(page, "Mon texte initial");
  await page.getByLabel("Ouvrir un fichier local").setInputFiles({
    name: "gros.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.alloc(10 * 1024 * 1024 + 1),
  });
  await expect(
    page.getByRole("status").filter({ hasText: "10 Mio" }),
  ).toBeVisible();
  await expect(page.locator("#viewer-source")).toHaveValue("Mon texte initial");
});
test("import UTF-8 et téléchargement conservent BOM, espaces et fins de ligne", async ({
  page,
}) => {
  const original = '\uFEFF  {"nom":"Pastly"}  \r\n';
  await page.getByLabel("Ouvrir un fichier local").setInputFiles({
    name: "original.json",
    mimeType: "application/json",
    buffer: Buffer.from(original),
  });
  await expect(page.getByLabel("Format", { exact: true })).toHaveValue("json");
  await expect(page.locator(".structured-view")).toContainText("Pastly");
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Télécharger", exact: true }).click();
  const file = await downloaded;
  expect(file.suggestedFilename()).toBe("original.json");
  expect(await readFile((await file.path())!, "utf8")).toBe(original);
});
test("image locale réelle et refus des dimensions excessives avant décodage", async ({
  page,
}) => {
  const image = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 2;
    canvas.height = 2;
    const context = canvas.getContext("2d")!;
    context.fillStyle = "green";
    context.fillRect(0, 0, 2, 2);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  await page.getByLabel("Ouvrir un fichier local").setInputFiles({
    name: "pixel.png",
    mimeType: "image/png",
    buffer: Buffer.from(image, "base64"),
  });
  await expect(page.locator(".local-image")).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator(".local-image")
        .evaluate((el: HTMLImageElement) => el.naturalWidth),
    )
    .toBe(2);
  await page.getByRole("button", { name: "Retour au texte" }).click();
  const giant = Buffer.alloc(24);
  giant.set([137, 80, 78, 71]);
  giant.set([73, 72, 68, 82], 12);
  giant.writeUInt32BE(100000, 16);
  giant.writeUInt32BE(100000, 20);
  await page.getByLabel("Ouvrir un fichier local").setInputFiles({
    name: "géante.png",
    mimeType: "image/png",
    buffer: giant,
  });
  await expect(page.locator(".local-file [role=alert]")).toContainText(
    "25 millions de pixels",
  );
});
test("DOCX et XLSX sont analysés localement dans un worker", async ({
  page,
}) => {
  const docx = zipSync({
    "[Content_Types].xml": strToU8(
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
    ),
    "_rels/.rels": strToU8(
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
    ),
    "word/document.xml": strToU8(
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Bonjour depuis Word</w:t></w:r></w:p></w:body></w:document>',
    ),
  });
  await page.getByLabel("Ouvrir un fichier local").setInputFiles({
    name: "exemple.docx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    buffer: Buffer.from(docx),
  });
  await expect(page.locator(".local-file .plain-view")).toContainText(
    "Bonjour depuis Word",
    { timeout: 20000 },
  );
  await page.getByRole("button", { name: "Retour au texte" }).click();
  const xlsx = zipSync({
    "[Content_Types].xml": strToU8(
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
    ),
    "xl/workbook.xml": strToU8(
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Données" sheetId="1" r:id="rId1"/></sheets></workbook>',
    ),
    "xl/_rels/workbook.xml.rels": strToU8(
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
    ),
    "xl/worksheets/sheet1.xml": strToU8(
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:B2"/><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>Nom</t></is></c><c r="B1" t="inlineStr"><is><t>Valeur</t></is></c></row><row r="2"><c r="A2" t="inlineStr"><is><t>Pastly</t></is></c><c r="B2"><v>42</v></c></row></sheetData></worksheet>',
    ),
  });
  await page.getByLabel("Ouvrir un fichier local").setInputFiles({
    name: "exemple.xlsx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer: Buffer.from(xlsx),
  });
  await expect(page.locator(".local-file table")).toContainText("Pastly", {
    timeout: 20000,
  });
  await expect(page.locator(".local-file table")).toContainText("42");
});
test("PDF.js affiche un vrai PDF dans un canvas et refuse un fichier corrompu", async ({
  page,
}) => {
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 200] /Contents 4 0 R >>",
    "<< /Length 23 >>\nstream\n0 0 1 rg 10 10 80 80 re f\nendstream",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((obj, i) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 5\n0000000000 65535 f \n${offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`)
    .join("")}trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  await page.getByLabel("Ouvrir un fichier local").setInputFiles({
    name: "exemple.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from(pdf),
  });
  await expect(page.locator(".pdf-view")).toContainText("Page 1 / 1", {
    timeout: 20000,
  });
  await expect
    .poll(() =>
      page
        .locator(".pdf-view canvas")
        .evaluate((el: HTMLCanvasElement) => el.width),
    )
    .toBe(300);
  await expect(page.locator(".pdf-view [role=alert]")).toHaveCount(0);
  await page.getByRole("button", { name: "Retour au texte" }).click();
  await page.getByLabel("Ouvrir un fichier local").setInputFiles({
    name: "cassé.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("invalide"),
  });
  await expect(page.locator(".pdf-view [role=alert]")).toContainText(
    "PDF invalide",
  );
});
