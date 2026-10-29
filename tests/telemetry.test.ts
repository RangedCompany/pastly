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
});
