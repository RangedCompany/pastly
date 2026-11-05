import { describe, expect, it } from "vitest";
import { excludeAdminTelemetry } from "../src/lib/telemetry";

describe("confidentialité de la télémétrie admin", () => {
  it.each([
    "https://pastly.fr/admin?q=private@example.test",
    "/admin?role=admin",
    "/admin/accounts",
  ])("exclut %s", (url) => {
    expect(excludeAdminTelemetry({ url })).toBeNull();
  });
  it("conserve les événements des autres pages", () => {
    const event = { url: "https://pastly.fr/explore", type: "pageview" };
    expect(excludeAdminTelemetry(event)).toBe(event);
  });
  it("ne transmet aucun terme de recherche privé ni événement de document", () => {
    expect(excludeAdminTelemetry({ url: "https://pastly.fr/explore?q=secret#contenu" })).toEqual({ url: "https://pastly.fr/explore" });
    expect(excludeAdminTelemetry({ url: "/dashboard?q=secret" })).toBeNull();
    expect(excludeAdminTelemetry({ url: "/notes/uuid" })).toBeNull();
  });
});
