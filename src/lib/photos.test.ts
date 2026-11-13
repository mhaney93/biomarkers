import { describe, expect, it } from "vitest";
import { sniffImageType } from "./photos";

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
