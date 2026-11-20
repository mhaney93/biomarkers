// Progress photos on readings. Only these biomarkers' pages show and accept them (Body Weight,
// whose page also lists the DEXA Intake Weight readings; see sources.ts).
export const PHOTO_BIOMARKER_IDS = new Set(["540a74f3-f0a8-4132-b02f-d759a0a3b2da"]); // Body Weight

export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
// Server Actions cap the request at next.config's bodySizeLimit; the client downsizes first.
export const MAX_PHOTO_BYTES = 3.5 * 1024 * 1024;

const ascii = (bytes: Uint8Array, from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));

/** The image type from its leading bytes, or null when it is not a supported image. */
export function sniffImageType(bytes: Uint8Array): (typeof PHOTO_TYPES)[number] | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP") return "image/webp";
  return null;
}

const concat = (parts: Uint8Array[]) => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
};

// JPEG: drop EXIF/XMP (APP1), IPTC and other APPn blocks, and comments. Keeps JFIF (APP0), an ICC
// colour profile (APP2 "ICC_PROFILE") and Adobe (APP14), which decoders need for colour.
function stripJpeg(bytes: Uint8Array): Uint8Array | null {
  const parts: Uint8Array[] = [bytes.slice(0, 2)];
  let i = 2;
  while (i + 4 <= bytes.length) {
    if (bytes[i] !== 0xff) return null;
    const marker = bytes[i + 1];
    if (marker === 0xff) {
      i++; // fill byte
      continue;
    }
    if (marker === 0xda) {
      parts.push(bytes.slice(i)); // start of scan: the image data runs to the end
      return concat(parts);
    }
    const end = i + 2 + ((bytes[i + 2] << 8) | bytes[i + 3]);
    if (end > bytes.length) return null;
    const isApp = marker >= 0xe0 && marker <= 0xef;
    const keep =
      !(isApp || marker === 0xfe) ||
      marker === 0xe0 ||
      marker === 0xee ||
      (marker === 0xe2 && ascii(bytes, i + 4, i + 16) === "ICC_PROFILE\0");
    if (keep) parts.push(bytes.slice(i, end));
    i = end;
  }
  return null;
}

// PNG: keep critical chunks and ancillary chunks that only describe the pixels; drop text, eXIf,
// timestamps and anything unknown.
const PNG_KEEP = new Set(["tRNS", "cHRM", "gAMA", "iCCP", "sBIT", "sRGB", "cICP", "bKGD", "pHYs", "acTL", "fcTL", "fdAT"]);
function stripPng(bytes: Uint8Array): Uint8Array | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const parts: Uint8Array[] = [bytes.slice(0, 8)];
  let i = 8;
  while (i + 12 <= bytes.length) {
    const end = i + 12 + view.getUint32(i);
    if (end > bytes.length) return null;
    const type = ascii(bytes, i + 4, i + 8);
    const critical = type.charCodeAt(0) < 0x61; // upper-case first letter
    if (critical || PNG_KEEP.has(type)) parts.push(bytes.slice(i, end));
    i = end;
    if (type === "IEND") return concat(parts);
  }
  return null;
}

// WebP: drop the EXIF and XMP chunks and clear their flags in the VP8X header.
function stripWebp(bytes: Uint8Array): Uint8Array | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const parts: Uint8Array[] = [];
  let i = 12;
  while (i + 8 <= bytes.length) {
    const size = view.getUint32(i + 4, true);
    const end = Math.min(bytes.length, i + 8 + size + (size & 1));
    if (i + 8 + size > bytes.length) return null;
    const fourcc = ascii(bytes, i, i + 4);
    if (fourcc !== "EXIF" && fourcc !== "XMP ") {
      const chunk = bytes.slice(i, end);
      if (fourcc === "VP8X") chunk[8] &= ~0x0c;
      parts.push(chunk);
    }
    i = end;
  }
  if (i !== bytes.length || parts.length === 0) return null;
  const body = concat(parts);
  const out = concat([bytes.slice(0, 12), body]);
  new DataView(out.buffer).setUint32(4, out.length - 8, true);
  return out;
}

/** The image without EXIF/XMP/text metadata (location included), or null when it can't be parsed. */
export function stripImageMetadata(bytes: Uint8Array, type: (typeof PHOTO_TYPES)[number]): Uint8Array | null {
  if (type === "image/jpeg") return stripJpeg(bytes);
  if (type === "image/png") return stripPng(bytes);
  return stripWebp(bytes);
}
