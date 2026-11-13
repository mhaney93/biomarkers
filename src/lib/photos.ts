// Progress photos on readings. Only these biomarkers' pages show and accept them (Body Weight,
// whose page also lists the DEXA Intake Weight readings; see sources.ts).
export const PHOTO_BIOMARKER_IDS = new Set(["540a74f3-f0a8-4132-b02f-d759a0a3b2da"]); // Body Weight

export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
// Server Actions cap the request at next.config's bodySizeLimit; the client downsizes first.
export const MAX_PHOTO_BYTES = 3.5 * 1024 * 1024;

/** The image type from its leading bytes, or null when it is not a supported image. */
export function sniffImageType(bytes: Uint8Array): (typeof PHOTO_TYPES)[number] | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  return null;
}
