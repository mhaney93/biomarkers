import assert from "node:assert/strict";
import { afterEach, beforeEach, test, vi } from "vitest";
import { TokenKeyError, decryptToken, encryptToken, isEncrypted } from "@/lib/token-crypto";

// Test-only key (base64 of "0123456789abcdef0123456789abcdef").
const KEY = "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=";
beforeEach(() => vi.stubEnv("TOKEN_ENCRYPTION_KEY", KEY));
afterEach(() => vi.unstubAllEnvs());

test("round-trips, never stores the plaintext, and uses a fresh IV each time", () => {
  const a = encryptToken("1//refresh", "google_auth.refresh_token");
  const b = encryptToken("1//refresh", "google_auth.refresh_token");
  assert.ok(isEncrypted(a));
  assert.ok(!a.includes("refresh"));
  assert.notEqual(a, b);
  assert.equal(decryptToken(a, "google_auth.refresh_token"), "1//refresh");
});

test("legacy plaintext reads through unchanged", () => {
  assert.equal(decryptToken("1//legacy", "google_auth.refresh_token"), "1//legacy");
});

test("a value moved to another column, a tampered value or a wrong key is refused", () => {
  const a = encryptToken("secret", "myair_auth.accessToken");
  assert.throws(() => decryptToken(a, "myair_auth.idToken"), TokenKeyError);
  assert.throws(() => decryptToken(a.slice(0, -2) + (a.endsWith("A") ? "BB" : "AA"), "myair_auth.accessToken"), TokenKeyError);
  vi.stubEnv("TOKEN_ENCRYPTION_KEY", "ab".repeat(32));
  assert.throws(() => decryptToken(a, "myair_auth.accessToken"), TokenKeyError);
});

test("a missing or short key is an error, not a plaintext write", () => {
  vi.stubEnv("TOKEN_ENCRYPTION_KEY", "");
  assert.throws(() => encryptToken("x", "c"), /not set/);
  vi.stubEnv("TOKEN_ENCRYPTION_KEY", "c2hvcnQ=");
  assert.throws(() => encryptToken("x", "c"), /32 bytes/);
});
