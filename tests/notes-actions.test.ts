import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  createClient: vi.fn(),
  ensureProfile: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  eq: vi.fn(),
  select: vi.fn(),
  single: vi.fn(),
  maybeSingle: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ requireUser: mocks.requireUser }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("@/lib/data", () => ({ ensureProfile: mocks.ensureProfile }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`REDIRECT:${path}`);
  },
}));
import { saveNote } from "../src/app/actions/notes";
const OWNER = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const ID = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";
beforeEach(() => {
  vi.clearAllMocks();
  const chain = {
    insert: mocks.insert,
    update: mocks.update,
    eq: mocks.eq,
    select: mocks.select,
    single: mocks.single,
    maybeSingle: mocks.maybeSingle,
  };
  mocks.requireUser.mockResolvedValue({ id: OWNER });
  mocks.ensureProfile.mockResolvedValue({});
  mocks.createClient.mockResolvedValue({ from: () => chain });
  for (const fn of [mocks.insert, mocks.update, mocks.eq, mocks.select])
    fn.mockReturnValue(chain);
  mocks.single.mockResolvedValue({ data: { id: ID }, error: null });
  mocks.maybeSingle.mockResolvedValue({ data: { id: ID }, error: null });
});
function form() {
  const data = new FormData();
  for (const [key, value] of Object.entries({
    title: "Code",
    content: "  \tconst a = 1;  \n",
    color: "yellow",
    format: "typescript",
    owner_id: ID,
  }))
    data.set(key, value);
  return data;
}
describe("sauvegarde serveur V2", () => {
  it("prend le propriétaire de la session, conserve la source et crée en privé", async () => {
    await expect(saveNote(null, {}, form())).rejects.toThrow(
      "REDIRECT:/dashboard?success=saved",
    );
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        owner_id: OWNER,
        content: "  \tconst a = 1;  \n",
        format: "typescript",
        content_kind: "code",
        is_public: false,
      }),
    );
  });
  it("exige une session avant toute écriture", async () => {
    mocks.requireUser.mockRejectedValue(new Error("connexion"));
    await expect(saveNote(null, {}, form())).rejects.toThrow("connexion");
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it("restreint l’édition au propriétaire et traite les refus sans succès fictif", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: null });
    expect(await saveNote(ID, {}, form())).toHaveProperty("error");
    expect(mocks.eq).toHaveBeenCalledWith("owner_id", OWNER);
  });
  it("ne réinterprète pas les anciens post-it et respecte leur visibilité explicite", async () => {
    const data = form();
    data.delete("format");
    data.set("is_public", "true");
    await expect(saveNote(ID, {}, data)).rejects.toThrow("REDIRECT");
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        format: "note",
        content_kind: "note",
        is_public: true,
      }),
    );
  });
});
