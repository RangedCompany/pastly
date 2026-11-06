import sharp from "sharp";
import { AVATAR_TYPES, MAX_AVATAR_BYTES } from "./avatar";
import { rasterDimensions } from "./viewer/image";

export async function prepareAvatar(file: File) {
  if (!file.size || file.size > MAX_AVATAR_BYTES)
    throw new Error("Choisissez une image de 2 Mo maximum.");
  if (!AVATAR_TYPES.includes(file.type))
    throw new Error("Choisissez une image JPG, PNG ou WebP.");
  try {
    const buffer = await file.arrayBuffer();
    rasterDimensions(buffer);
    const image = sharp(Buffer.from(buffer), {
      limitInputPixels: 25_000_000,
      failOn: "warning",
    });
    const metadata = await image.metadata();
    if (
      !["jpeg", "png", "webp"].includes(metadata.format ?? "") ||
      (metadata.pages ?? 1) > 1
    )
      throw new Error("Format non pris en charge");
    // Re-encoding also removes EXIF metadata and any appended source content.
    return await image.rotate().resize(512, 512, { fit: "cover" })
      .webp({ quality: 85 }).toBuffer();
  } catch {
    throw new Error("Cette image est invalide ou trop grande. Choisissez une image JPG, PNG ou WebP non animée.");
  }
}
