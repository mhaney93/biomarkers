// AES-256-GCM encryption for the third-party tokens kept in the DB (google_auth, myair_auth), so a DB
// dump or a leaked DATABASE_URL alone does not hand out the owner's Google or myAir access. The key
// comes from env TOKEN_ENCRYPTION_KEY (32 bytes, base64 or hex; `openssl rand -base64 32`) and lives
// only in the Vercel env, never in the DB.
//
// Stored form: "enc:v1:" + base64url(iv | tag | ciphertext). The column name is bound in as AAD, so a
// value can't be moved to another column. Values without the prefix are legacy plaintext: they are
// read as-is and re-encrypted by the sync on its next read (isEncrypted).
import crypto from "node:crypto";

const PREFIX = "enc:v1:";
const IV_BYTES = 12;
const TAG_BYTES = 16;

export class TokenKeyError extends Error {}

function key(): Buffer {
  const raw = process.env.TOKEN_ENCRYPTION_KEY?.trim();
  if (!raw) throw new TokenKeyError("TOKEN_ENCRYPTION_KEY is not set");
  const buf = /^[0-9a-f]{64}$/i.test(raw) ? Buffer.from(raw, "hex") : Buffer.from(raw, "base64");
  if (buf.length !== 32) throw new TokenKeyError("TOKEN_ENCRYPTION_KEY must be 32 bytes (base64 or hex)");
  return buf;
}

export const isEncrypted = (value: string) => value.startsWith(PREFIX);

export function encryptToken(value: string, column: string): string {
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  cipher.setAAD(Buffer.from(column));
  const ct = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return PREFIX + Buffer.concat([iv, cipher.getAuthTag(), ct]).toString("base64url");
}

export function decryptToken(stored: string, column: string): string {
  if (!isEncrypted(stored)) return stored;
  const buf = Buffer.from(stored.slice(PREFIX.length), "base64url");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key(), buf.subarray(0, IV_BYTES));
  decipher.setAAD(Buffer.from(column));
  decipher.setAuthTag(buf.subarray(IV_BYTES, IV_BYTES + TAG_BYTES));
  try {
    return Buffer.concat([decipher.update(buf.subarray(IV_BYTES + TAG_BYTES)), decipher.final()]).toString("utf8");
  } catch {
    throw new TokenKeyError(`Stored ${column} does not decrypt with TOKEN_ENCRYPTION_KEY`);
  }
}

// Nullable-column helpers.
export const encryptNullable = (value: string | null | undefined, column: string) =>
  value == null ? value : encryptToken(value, column);
export const decryptNullable = (value: string | null, column: string) => (value == null ? null : decryptToken(value, column));
