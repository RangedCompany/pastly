import sharp from "sharp";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(), ensureProfile: vi.fn(), createClient: vi.fn(),
  update: vi.fn(), eq: vi.fn(), select: vi.fn(), maybeSingle: vi.fn(),
  upload: vi.fn(), remove: vi.fn(), revalidatePath: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ requireUser: mocks.requireUser }));
vi.mock("@/lib/data", () => ({ ensureProfile: mocks.ensureProfile }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
import { uploadAvatar, removeAvatar } from "../src/app/actions/profile";

const OWNER = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const OLD = `${OWNER}/bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb.webp`;
let png: Uint8Array<ArrayBuffer>;
beforeAll(async () => {
  png = new Uint8Array(await sharp({ create: { width: 20, height: 10, channels: 3, background: "green" } }).png().toBuffer());
});
beforeEach(() => {
  vi.resetAllMocks();
  const query = { update: mocks.update, eq: mocks.eq, select: mocks.select, maybeSingle: mocks.maybeSingle };
  for (const fn of [mocks.update, mocks.eq, mocks.select]) fn.mockReturnValue(query);
  mocks.requireUser.mockResolvedValue({ id: OWNER });
  mocks.ensureProfile.mockResolvedValue({ avatar_path: OLD });
  mocks.createClient.mockResolvedValue({ from: () => query, storage: { from: () => ({ upload: mocks.upload, remove: mocks.remove }) } });
  mocks.maybeSingle.mockResolvedValue({ data: { id: OWNER }, error: null });
  mocks.upload.mockResolvedValue({ error: null });
  mocks.remove.mockResolvedValue({ error: null });
});
function form() {
  const data = new FormData();
  data.set("avatar", new File([png], "photo.png", { type: "image/png" }));
  data.set("owner_id", "cccccccc-cccc-4ccc-accc-cccccccccccc");
  return data;
}

describe("sauvegarde des photos de profil", () => {
  it("prend le propriétaire dans la session et remplace la photo après sauvegarde", async () => {
    const result = await uploadAvatar(form());
    expect(result.success).toBeTruthy();
    expect(result.avatarPath).toMatch(new RegExp(`^${OWNER}/[a-f0-9-]{36}\\.webp$`));
    expect(mocks.upload).toHaveBeenCalledWith(result.avatarPath, expect.any(Buffer), expect.objectContaining({ upsert: false, contentType: "image/webp" }));
    expect(mocks.eq).toHaveBeenCalledWith("id", OWNER);
    expect(mocks.update).toHaveBeenCalledWith({ avatar_path: result.avatarPath });
    expect(mocks.remove).toHaveBeenCalledWith([OLD]);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/", "layout");
  });
  it("exige la connexion avant de traiter le fichier", async () => {
    mocks.requireUser.mockRejectedValue(new Error("connexion"));
    await expect(uploadAvatar(form())).rejects.toThrow("connexion");
    expect(mocks.upload).not.toHaveBeenCalled();
  });
  it("ne touche pas au profil si le transfert échoue", async () => {
    mocks.upload.mockResolvedValue({ error: { message: "refus" } });
    expect(await uploadAvatar(form())).toHaveProperty("error");
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.remove).not.toHaveBeenCalled();
  });
  it("nettoie le nouvel objet si la base refuse la modification", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: null });
    expect(await uploadAvatar(form())).toHaveProperty("error");
    const newPath = mocks.upload.mock.calls[0][0];
    expect(mocks.remove).toHaveBeenCalledExactlyOnceWith([newPath]);
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
  it("refuse un faux fichier sans accès au stockage", async () => {
    const data = form();
    data.set("avatar", new File(["faux"], "photo.png", { type: "image/png" }));
    expect(await uploadAvatar(data)).toHaveProperty("error");
    expect(mocks.upload).not.toHaveBeenCalled();
  });
  it("nettoie également un envoi après une erreur réseau de la base", async () => {
    mocks.maybeSingle.mockRejectedValue(new Error("réseau"));
    expect(await uploadAvatar(form())).toHaveProperty("error");
    expect(mocks.remove).toHaveBeenCalledExactlyOnceWith([mocks.upload.mock.calls[0][0]]);
  });
  it("retire la référence et le fichier lors de la suppression", async () => {
    expect(await removeAvatar()).toMatchObject({ avatarPath: null, success: expect.any(String) });
    expect(mocks.update).toHaveBeenCalledWith({ avatar_path: null });
    expect(mocks.eq).toHaveBeenCalledWith("id", OWNER);
    expect(mocks.remove).toHaveBeenCalledWith([OLD]);
  });
  it("conserve le fichier si la suppression du profil est refusée", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: { code: "42501" } });
    expect(await removeAvatar()).toHaveProperty("error");
    expect(mocks.remove).not.toHaveBeenCalled();
  });
});
