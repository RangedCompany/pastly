import { describe, expect, it } from "vitest";
import {
  noteSchema,
  profileSchema,
  safeNext,
  parsePage,
  searchFilter,
  searchTerm,
} from "../src/lib/validation";

describe("validation des entrées serveur", () => {
  it("valide et nettoie une note", () => {
    expect(
      noteSchema.parse({
        title: "  Idée  ",
        content: " Une pensée ",
        color: "yellow",
        is_public: true,
      }),
    ).toEqual({
      title: "Idée",
      content: "Une pensée",
      color: "yellow",
      is_public: true,
    });
  });
  it.each([
    { title: " ", content: "bonjour", color: "yellow", is_public: true },
    { title: "Idée", content: " ", color: "yellow", is_public: true },
    {
      title: "a".repeat(121),
      content: "bonjour",
      color: "yellow",
      is_public: true,
    },
    {
      title: "Idée",
      content: "a".repeat(5001),
      color: "yellow",
      is_public: true,
    },
    { title: "Idée", content: "bonjour", color: "red", is_public: true },
    { title: "Idée", content: "bonjour", color: "yellow", is_public: "false" },
  ])("rejette les notes invalides", (note) =>
    expect(noteSchema.safeParse(note).success).toBe(false),
  );
  it("normalise les noms et empêche les noms invalides", () => {
    expect(
      profileSchema.parse({ username: " Alice_12 ", display_name: " Alice " })
        .username,
    ).toBe("alice_12");
    expect(
      profileSchema.safeParse({ username: "a/b", display_name: "Alice" })
        .success,
    ).toBe(false);
  });
});
describe("redirections et paramètres", () => {
  it.each([
    "https://evil.test",
    "//evil.test",
    "/\\evil.test",
    "/%5cevil.test",
    "/%2fevil.test",
    "/ok%0aX",
    "javascript:alert(1)",
    "%",
    null,
  ])("rejette une redirection externe ou mal formée : %s", (value) =>
    expect(safeNext(value)).toBe("/dashboard"),
  );
  it("conserve une destination interne et sa recherche", () =>
    expect(safeNext("/notes/new?q=abc")).toBe("/notes/new?q=abc"));
  it.each(["0", "-1", "1.5", "Infinity", "NaN", "x"])(
    "normalise la page %s",
    (value) => expect(parsePage(value)).toBe(1),
  );
  it("borne la pagination et la recherche", () => {
    expect(parsePage("999999")).toBe(10000);
    expect(searchTerm(" x ")).toBe("x");
    expect(searchTerm("x".repeat(101))).toHaveLength(100);
  });
  it("échappe les délimiteurs et jokers PostgREST", () => {
    expect(searchFilter('x%,title.eq."oops')).toBe(
      'title.ilike."%x\\%,title.eq.\\"oops%",content.ilike."%x\\%,title.eq.\\"oops%"',
    );
  });
});
