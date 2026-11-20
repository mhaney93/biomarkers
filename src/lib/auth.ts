import crypto from "node:crypto";
import { cookies, headers } from "next/headers";
import { and, count, eq, gt, lt, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { authSessions, unlockFailures } from "@/db/schema";

// The edit session cookie: a random token whose keyed hash is a row in auth_sessions. Renamed from
// the old password-hash cookie ("biomarkers_auth"), which is no longer accepted.
export const AUTH_COOKIE = "biomarkers_session";
const SESSION_MS = 30 * 24 * 60 * 60 * 1000;
const TOKEN = /^[A-Za-z0-9_-]{43}$/; // 32 random bytes, base64url

// Unlock lockout: after this many wrong passwords inside the window, unlock refuses (even the
// right password) until the window moves past them. Per IP, and across all IPs.
export const UNLOCK_WINDOW_MS = 15 * 60 * 1000;
export const MAX_FAILURES_PER_IP = 5;
export const MAX_FAILURES_GLOBAL = 20;

function appPassword() {
  const password = process.env.APP_PASSWORD;
  if (!password) throw new Error("APP_PASSWORD is not set");
  return password;
}

// A slow key derived from APP_PASSWORD (cached per process). Session hashes and the Google OAuth
// state are keyed by it, so changing the password invalidates both.
let derived: { password: string; key: Buffer } | null = null;
function serverKey() {
  const password = appPassword();
  if (derived?.password !== password) {
    derived = { password, key: crypto.scryptSync(password, "biomarkers-server-key-v1", 32) };
  }
  return derived.key;
}

const hmac = (label: string) => crypto.createHmac("sha256", serverKey()).update(label).digest("hex");

export function hashSessionToken(token: string) {
  return hmac(`session:${token}`);
}

export function oauthStateKey() {
  return hmac("google-oauth-state");
}

/** Constant-time check of a submitted password against APP_PASSWORD. */
export function passwordMatches(input: string) {
  const digest = (s: string) => crypto.createHash("sha256").update(s).digest();
  return crypto.timingSafeEqual(digest(input), digest(appPassword()));
}

export async function clientIp() {
  const h = await headers();
  return h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function unlockLockedOut(ip: string) {
  const since = new Date(Date.now() - UNLOCK_WINDOW_MS);
  const [row] = await getDb()
    .select({ total: count(), mine: sql<string>`count(*) filter (where ${unlockFailures.ip} = ${ip})` })
    .from(unlockFailures)
    .where(gt(unlockFailures.at, since));
  return Number(row?.mine ?? 0) >= MAX_FAILURES_PER_IP || Number(row?.total ?? 0) >= MAX_FAILURES_GLOBAL;
}

export async function recordUnlockFailure(ip: string) {
  const db = getDb();
  await db.insert(unlockFailures).values({ ip });
  await db.delete(unlockFailures).where(lt(unlockFailures.at, new Date(Date.now() - 24 * 60 * 60 * 1000)));
}

export async function clearUnlockFailures(ip: string) {
  await getDb().delete(unlockFailures).where(eq(unlockFailures.ip, ip));
}

/** Starts a new edit session and sets its cookie. */
export async function createSession() {
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_MS);
  const db = getDb();
  await db.insert(authSessions).values({ tokenHash: hashSessionToken(token), expiresAt });
  await db.delete(authSessions).where(lt(authSessions.expiresAt, new Date()));
  (await cookies()).set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/** Ends this browser's session: deletes its row and the cookie. */
export async function endSession() {
  const store = await cookies();
  const token = store.get(AUTH_COOKIE)?.value;
  if (token && TOKEN.test(token)) {
    await getDb().delete(authSessions).where(eq(authSessions.tokenHash, hashSessionToken(token)));
  }
  store.delete(AUTH_COOKIE);
}

export async function isAuthed() {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  if (!token || !TOKEN.test(token)) return false;
  const [row] = await getDb()
    .select({ tokenHash: authSessions.tokenHash })
    .from(authSessions)
    .where(and(eq(authSessions.tokenHash, hashSessionToken(token)), gt(authSessions.expiresAt, new Date())));
  return Boolean(row);
}

export async function requireAuth() {
  if (!(await isAuthed())) {
    throw new Error("Enter the password to make changes.");
  }
}
