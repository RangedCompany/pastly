import { beforeEach, describe, expect, it, vi } from "vitest";
const { query, configured } = vi.hoisted(() => ({ query: vi.fn(), configured: vi.fn(() => true) }));
vi.mock("@/lib/env", () => ({ isSupabaseConfigured: configured }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({
  from: () => ({ select: () => ({ eq: () => ({ maybeSingle: query }) }) }),
}) }));
import { GET } from "../src/app/raw/[id]/route";
const id = "12345678-1234-4234-8234-123456789abc";
const read = (value = id) => GET(new Request(`https://pastly.test/raw/${value}`), { params: Promise.resolve({ id: value }) });
describe("source raw", () => {
  beforeEach(() => { vi.clearAllMocks(); });
  it("returns the exact source as uncached plain text, including HTML", async () => {
    const source = "  <script>alert(1)</script>\r\n\n";
    query.mockResolvedValue({ data: { content: source }, error: null });
    const response = await read();
    expect(await response.text()).toBe(source);
    expect(response.headers.get("Content-Type")).toBe("text/plain; charset=utf-8");
    expect(response.headers.get("Cache-Control")).toContain("no-store");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });
  it("returns 404 when RLS hides a private note or the note does not exist", async () => {
    query.mockResolvedValue({ data: null, error: null });
    expect((await read()).status).toBe(404);
  });
  it("rejects invalid identifiers without a database request", async () => {
    expect((await read("invalid")).status).toBe(404);
    expect(query).not.toHaveBeenCalled();
  });
  it("reports database failures without exposing their details", async () => {
    query.mockResolvedValue({ data: null, error: { message: "internal" } });
    const response = await read();
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("internal");
  });
});
