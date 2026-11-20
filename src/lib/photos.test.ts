import { describe, expect, it } from "vitest";
import { sniffImageType, stripImageMetadata } from "./photos";

describe("sniffImageType", () => {
  it("detects JPEG, PNG and WebP by their magic bytes", () => {
    expect(sniffImageType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(sniffImageType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]))).toBe("image/png");
    expect(sniffImageType(new TextEncoder().encode("RIFF\0\0\0\0WEBPVP8 "))).toBe("image/webp");
  });

  it("rejects anything else, whatever the file is named", () => {
    expect(sniffImageType(new TextEncoder().encode("<svg xmlns="))).toBeNull();
    expect(sniffImageType(new Uint8Array([]))).toBeNull();
  });
});

const enc = (t: string) => new TextEncoder().encode(t);
const cat = (...parts: (Uint8Array | number[])[]) => new Uint8Array(parts.flatMap((p) => Array.from(p)));
const has = (bytes: Uint8Array, text: string) => new TextDecoder("latin1").decode(bytes).includes(text);

describe("stripImageMetadata", () => {
  it("drops JPEG EXIF and comments, keeps JFIF, ICC and the scan", () => {
    const seg = (marker: number, body: Uint8Array) => cat([0xff, marker, 0, body.length + 2], body);
    const jpeg = cat(
      [0xff, 0xd8],
      seg(0xe0, enc("JFIF\0")),
      seg(0xe1, enc("Exif\0\0GPS-SECRET")),
      seg(0xfe, enc("comment-secret")),
      seg(0xe2, enc("ICC_PROFILE\0p")),
      [0xff, 0xda, 0, 2, 1, 2, 3, 0xff, 0xd9],
    );
    const out = stripImageMetadata(jpeg, "image/jpeg")!;
    expect(has(out, "GPS-SECRET") || has(out, "comment-secret")).toBe(false);
    expect(has(out, "JFIF") && has(out, "ICC_PROFILE")).toBe(true);
    expect(Array.from(out.slice(-9))).toEqual([0xff, 0xda, 0, 2, 1, 2, 3, 0xff, 0xd9]);
  });

  it("drops PNG text and eXIf chunks", () => {
    const chunk = (type: string, data: Uint8Array) =>
      cat([0, 0, 0, data.length], enc(type), data, [0, 0, 0, 0]);
    const png = cat(
      [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
      chunk("IHDR", new Uint8Array(13)),
      chunk("tEXt", enc("Location\0secret")),
      chunk("eXIf", enc("exif-secret")),
      chunk("IDAT", enc("pixels")),
      chunk("IEND", new Uint8Array()),
    );
    const out = stripImageMetadata(png, "image/png")!;
    expect(has(out, "secret")).toBe(false);
    expect(has(out, "IHDR") && has(out, "IDAT") && has(out, "IEND")).toBe(true);
  });

  it("drops WebP EXIF/XMP chunks, clears their VP8X flags and fixes the RIFF size", () => {
    const chunk = (fourcc: string, data: Uint8Array) =>
      cat(enc(fourcc), [data.length, 0, 0, 0], data, data.length & 1 ? [0] : []);
    const body = cat(
      enc("WEBP"),
      chunk("VP8X", new Uint8Array([0x0c, 0, 0, 0, 0, 0, 0, 0, 0, 0])),
      chunk("VP8 ", enc("frame")),
      chunk("EXIF", enc("exif-secret")),
      chunk("XMP ", enc("xmp-secret")),
    );
    const webp = cat(enc("RIFF"), [body.length, 0, 0, 0], body);
    const out = stripImageMetadata(webp, "image/webp")!;
    expect(has(out, "secret")).toBe(false);
    expect(out[20]).toBe(0);
    expect(new DataView(out.buffer).getUint32(4, true)).toBe(out.length - 8);
  });

  it("rejects truncated files", () => {
    expect(stripImageMetadata(new Uint8Array([0xff, 0xd8, 0xff, 0xe1, 0x10, 0x00]), "image/jpeg")).toBeNull();
  });
});
