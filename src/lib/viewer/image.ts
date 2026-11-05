// Inspect dimensions before asking the browser to allocate decoded pixel buffers.
export function rasterDimensions(buffer: ArrayBuffer): {
  width: number;
  height: number;
} {
  const b = new Uint8Array(buffer),
    v = new DataView(buffer);
  const text = (offset: number, length: number) =>
    String.fromCharCode(...b.slice(offset, offset + length));
  let width = 0,
    height = 0;
  if (
    b.length >= 24 &&
    b[0] === 137 &&
    text(1, 3) === "PNG" &&
    text(12, 4) === "IHDR"
  ) {
    width = v.getUint32(16);
    height = v.getUint32(20);
  } else if (b.length >= 10 && /^GIF8[79]a$/.test(text(0, 6))) {
    width = v.getUint16(6, true);
    height = v.getUint16(8, true);
  } else if (b[0] === 255 && b[1] === 216) {
    let offset = 2;
    while (offset + 8 < b.length) {
      if (b[offset++] !== 255) break;
      while (b[offset] === 255) offset++;
      const marker = b[offset++];
      if (marker === 217 || marker === 218) break;
      if (marker === 1 || (marker >= 208 && marker <= 215)) continue;
      const length = v.getUint16(offset);
      if (length < 2 || offset + length > b.length) break;
      if (
        [
          192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207,
        ].includes(marker)
      ) {
        height = v.getUint16(offset + 3);
        width = v.getUint16(offset + 5);
        break;
      }
      offset += length;
    }
  } else if (b.length >= 30 && text(0, 4) === "RIFF" && text(8, 4) === "WEBP") {
    const type = text(12, 4);
    if (type === "VP8X") {
      width = 1 + b[24] + (b[25] << 8) + (b[26] << 16);
      height = 1 + b[27] + (b[28] << 8) + (b[29] << 16);
    } else if (
      type === "VP8 " &&
      b[23] === 157 &&
      b[24] === 1 &&
      b[25] === 42
    ) {
      width = v.getUint16(26, true) & 0x3fff;
      height = v.getUint16(28, true) & 0x3fff;
    } else if (type === "VP8L" && b[20] === 47) {
      const bits = v.getUint32(21, true);
      width = (bits & 0x3fff) + 1;
      height = ((bits >>> 14) & 0x3fff) + 1;
    }
  }
  if (!width || !height)
    throw new Error("Image invalide ou en-tête non pris en charge.");
  if (width * height > 25_000_000 || width > 16384 || height > 16384)
    throw new Error(
      "Image limitée à 25 millions de pixels et 16 384 pixels par côté.",
    );
  return { width, height };
}
