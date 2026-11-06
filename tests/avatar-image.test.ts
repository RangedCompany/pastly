import sharp from "sharp";
import { afterEach, describe, expect, it, vi } from "vitest";
import { prepareAvatar } from "../src/lib/avatar-image";
import { avatarUrl, MAX_AVATAR_BYTES } from "../src/lib/avatar";

afterEach(() => vi.unstubAllEnvs());

describe("photos de profil", () => {
  it("recadre une vraie image et retire ses métadonnées", async () => {
    const original = await sharp({ create: { width: 160, height: 80, channels: 3, background: "green" } })
      .withExif({ IFD0: { Copyright: "Donnée privée" } }).jpeg().toBuffer();
    const result = await prepareAvatar(new File([new Uint8Array(original)], "photo.jpg", { type: "image/jpeg" }));
    const metadata = await sharp(result).metadata();
    expect(metadata).toMatchObject({ format: "webp", width: 512, height: 512 });
    expect(metadata.exif).toBeUndefined();
    expect(result.length).toBeLessThan(MAX_AVATAR_BYTES);
  });
  it("refuse les SVG, les contenus déguisés, les fichiers vides et trop lourds", async () => {
    for (const file of [
      new File(["<svg />"], "image.svg", { type: "image/svg+xml" }),
      new File(["<script>alert(1)</script>"], "image.png", { type: "image/png" }),
      new File([], "image.png", { type: "image/png" }),
      new File([new Uint8Array(MAX_AVATAR_BYTES + 1)], "image.jpg", { type: "image/jpeg" }),
    ]) await expect(prepareAvatar(file)).rejects.toThrow();
  });
  it("construit uniquement des URL du bucket configuré", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co/");
    const path = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa/bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb.webp";
    expect(avatarUrl(path)).toBe(`https://project.supabase.co/storage/v1/object/public/avatars/${path}`);
    for (const invalid of [null, "https://example.test/photo.jpg", "../photo.webp", "/etc/passwd"])
      expect(avatarUrl(invalid)).toBeNull();
  });
});
