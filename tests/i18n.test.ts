import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import ts from "typescript";
import {
  createTranslator,
  LOCALES,
  resolveLocale,
} from "../src/lib/i18n/locale";

describe("browser language negotiation", () => {
  it.each([
    [undefined, "es-MX,es;q=0.9,en;q=0.8", "es"],
    [undefined, "zh-CN,ja-JP;q=0.8,en;q=0.7", "ja"],
    [undefined, "en;q=0.3,de-AT;q=0.9,fr;q=0.5", "de"],
    [undefined, "EN-gb,fr;q=0.5", "en"],
    [undefined, "fr;q=0,de;q=0.4", "de"],
    [undefined, "fr;q=invalid,es;q=2,it;q=0.8", "it"],
    [undefined, "nl;q=0.8,pt;q=0.8", "nl"],
    [undefined, "zh-CN,ar;q=0.9", "en"],
    [undefined, "", "en"],
    ["pt", "fr-FR", "pt"],
    ["invalid", "fr-CA,en;q=0.8", "fr"],
  ])("choice %s and header %s select %s", (saved, header, expected) => {
    expect(resolveLocale(saved, header)).toBe(expected);
  });
});

describe("translation catalogs", () => {
  const catalogs = Object.fromEntries(
    LOCALES.map((locale) => [
      locale,
      JSON.parse(
        readFileSync(
          new URL(`../src/lib/i18n/messages/${locale}.json`, import.meta.url),
          "utf8",
        ),
      ) as Record<string, string>,
    ]),
  );
  const tokens = (text: string) =>
    [...text.matchAll(/\{\w+\}/g)].map(([token]) => token).sort();

  it("includes the translation keys referenced by pages and components", () => {
    function scan(directory: URL) {
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const url = new URL(
          entry.name + (entry.isDirectory() ? "/" : ""),
          directory,
        );
        if (entry.isDirectory()) {
          scan(url);
          continue;
        }
        if (!/\.tsx?$/.test(entry.name)) continue;
        const source = ts.createSourceFile(
          entry.name,
          readFileSync(url, "utf8"),
          ts.ScriptTarget.Latest,
          true,
          entry.name.endsWith("tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
        );
        function check(argument: ts.Node) {
          if (ts.isStringLiteral(argument))
            expect(
              Object.hasOwn(catalogs.fr, argument.text),
              `${url.pathname}: ${argument.text}`,
            ).toBe(true);
          if (ts.isConditionalExpression(argument)) {
            check(argument.whenTrue);
            check(argument.whenFalse);
          }
        }
        function visit(node: ts.Node) {
          if (
            ts.isCallExpression(node) &&
            ["t", "t.plural"].includes(node.expression.getText(source))
          ) {
            node.arguments
              .slice(0, node.expression.getText(source) === "t.plural" ? 2 : 1)
              .forEach(check);
          }
          ts.forEachChild(node, visit);
        }
        visit(source);
      }
    }
    scan(new URL("../src/", import.meta.url));
  });

  it.each(LOCALES)(
    "%s covers the whole catalog and preserves variables",
    (locale) => {
      expect(Object.keys(catalogs[locale]).sort()).toEqual(
        Object.keys(catalogs.fr).sort(),
      );
      for (const [key, translation] of Object.entries(catalogs[locale])) {
        expect(translation.trim(), `${locale}: ${key}`).not.toBe("");
        expect(tokens(translation), `${locale}: ${key}`).toEqual(tokens(key));
        expect(translation).not.toMatch(/ZXQVAR\d+QXZ/);
      }
    },
  );

  it("interpolates values literally without translating user content", () => {
    const t = createTranslator("en", catalogs.en);
    const title = "Mon profil <script>alert(1)</script> {title}";
    expect(t("Modifier « {value0} »", { value0: title })).toContain(title);
    expect(t("Unknown parser diagnostic")).toBe("Unknown parser diagnostic");
    expect(t("toString")).toBe("toString");
  });

  it("uses each language's plural rules", () => {
    const fr = createTranslator("fr", catalogs.fr);
    const en = createTranslator("en", catalogs.en);
    expect(fr.plural("{count} contenu", "{count} contenus", 0)).toBe(
      "0 contenu",
    );
    expect(en.plural("{count} contenu", "{count} contenus", 0)).toContain("0");
    expect(en.plural("{count} contenu", "{count} contenus", 1)).not.toEqual(
      en.plural("{count} contenu", "{count} contenus", 2),
    );
  });
});
