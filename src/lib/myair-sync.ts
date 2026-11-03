// The myAir sync: sign in to myAir, read recent nights and backfill older months a month at a time
// from a resumable cursor into cpap_nights, then write each completed month's averages to the
// CPAP biomarkers in the Sleep category. Run by the daily cron and the Sleep page's "Sync myAir".
import { eq, gte, inArray, max, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { biomarkers, cpapNights, myairAuth, readings } from "@/db/schema";
import { CATEGORY, lastDayOfMonth, pacificToday } from "@/lib/sleep";
import {
  BACKFILL_EMPTY_MONTHS,
  BACKFILL_FLOOR,
  CPAP_BIOMARKERS,
  firstOfMonth,
  mapRecord,
  monthWindows,
  monthlyCpap,
  previousMonth,
  recentFrom,
  type CpapNight,
} from "@/lib/cpap";
import {
  MYAIR_NA,
  MyAirAuthError,
  MyAirStaleTokenError,
  myAirAuth,
  myAirClient,
  myAirConfigured,
  myAirCredentials,
  type MyAirClient,
  type MyAirTokens,
} from "@/lib/myair";

export type CpapPublishResult = { from: string; before: string; added: string[]; updated: string[]; skipped: number };

export type MyAirSyncResult = {
  at: string;
  error?: "not-configured" | "mfa" | "auth" | "failed";
  message?: string;
  windows: { from: string; to: string; nights: number }[];
  latest: string | null;
  backfillFrom: string | null;
  backfillDone: boolean;
  more: boolean;
  warnings: string[];
  published?: CpapPublishResult;
};

// myAir wants an emailed code before it will sign in (accounts with email verification on).
class MfaRequiredError extends Error {}

type AuthRow = typeof myairAuth.$inferSelect;

async function authRow(): Promise<AuthRow> {
  const db = getDb();
  await db.insert(myairAuth).values({ id: 1 }).onConflictDoNothing({ target: myairAuth.id });
  const [row] = await db.select().from(myairAuth).where(eq(myairAuth.id, 1));
  return row;
}

const setAuth = (values: Partial<typeof myairAuth.$inferInsert>) =>
  getDb().update(myairAuth).set(values).where(eq(myairAuth.id, 1));

async function saveTokens(tokens: MyAirTokens, deviceToken: string | null) {
  await setAuth({
    accessToken: tokens.accessToken,
    idToken: tokens.idToken,
    tokenExpiresAt: new Date(tokens.expiresAt),
    ...(deviceToken ? { deviceToken } : {}),
    mfaStateToken: null,
    mfaVerifyUrl: null,
    mfaSentAt: null,
  });
}

// A token that is still good, else a fresh sign-in with the env credentials.
async function signIn(row: AuthRow, fetchImpl: typeof fetch, force = false): Promise<{ tokens: MyAirTokens; fresh: boolean }> {
  if (!force && row.accessToken && row.idToken && row.tokenExpiresAt && row.tokenExpiresAt.getTime() > Date.now())
    return { tokens: { accessToken: row.accessToken, idToken: row.idToken, expiresAt: row.tokenExpiresAt.getTime() }, fresh: false };
  const { username, password } = myAirCredentials();
  const r = await myAirAuth(MYAIR_NA, fetchImpl).login(username, password, row.deviceToken);
  if (r.status === "MFA_REQUIRED") {
    if (r.deviceToken && r.deviceToken !== row.deviceToken) await setAuth({ deviceToken: r.deviceToken });
    throw new MfaRequiredError("myAir wants an emailed code: use Send code, then enter it");
  }
  await saveTokens(r.tokens, r.deviceToken);
  return { tokens: r.tokens, fresh: true };
}

// A client that signs in again once when myAir stops accepting a stored token.
function retryingClient(row: AuthRow, fetchImpl: typeof fetch): MyAirClient {
  let client: MyAirClient | null = null;
  let fresh = false;
  const get = async (force: boolean) => {
    if (!client || force) {
      const s = await signIn(row, fetchImpl, force);
      client = myAirClient(MYAIR_NA, s.tokens, fetchImpl);
      fresh = s.fresh;
    }
    return client;
  };
  return {
    async sleepRecords(from, to) {
      try {
        return await (await get(false)).sleepRecords(from, to);
      } catch (e) {
        if (!(e instanceof MyAirStaleTokenError) || fresh) throw e;
        return (await get(true)).sleepRecords(from, to);
      }
    },
  };
}

const excluded = (column: string) => sql.raw(`excluded.${column}`);

// Read one window and upsert its nights (one row per night, so rereads never duplicate one).
async function syncWindow(c: MyAirClient, from: string, to: string, warnings: string[]) {
  const nights = new Map<string, CpapNight>();
  for (const r of await c.sleepRecords(from, to)) {
    const n = mapRecord(r);
    if (!n) warnings.push(`record without a date: ${JSON.stringify(r).slice(0, 120)}`);
    else if (n.date >= from && n.date <= to) nights.set(n.date, n);
  }
  if (nights.size) {
    await getDb()
      .insert(cpapNights)
      .values([...nights.values()])
      .onConflictDoUpdate({
        target: cpapNights.date,
        set: {
          usageMinutes: excluded("usage_minutes"),
          ahi: excluded("ahi"),
          leak: excluded("leak"),
          maskPairs: excluded("mask_pairs"),
          score: excluded("score"),
          syncedAt: sql`now()`,
        },
      });
  }
  return { from, to, nights: nights.size };
}

// Write each completed month from `from` (YYYY-MM-01, the oldest fully read month) on. A month that
// already has a reading (on any date in it) gets myAir's value if it differs, note included.
export async function publishCpapMonths(from: string, today = pacificToday()): Promise<CpapPublishResult> {
  const db = getDb();
  const before = today.slice(0, 7);
  const nights = await db.select().from(cpapNights).where(gte(cpapNights.date, from));
  const months = monthlyCpap(nights, before);
  const result: CpapPublishResult = { from, before, added: [], updated: [], skipped: 0 };

  const names = CPAP_BIOMARKERS.map((b) => b.name);
  const ids = new Map(
    (await db.select({ id: biomarkers.id, name: biomarkers.name }).from(biomarkers).where(inArray(biomarkers.name, names))).map(
      (b) => [b.name, b.id],
    ),
  );
  for (const b of CPAP_BIOMARKERS) {
    if (ids.has(b.name) || !months.some((m) => m[b.key] != null)) continue;
    await db
      .insert(biomarkers)
      .values({ name: b.name, unit: b.unit, valueType: b.valueType, category: CATEGORY, refLow: b.refLow, refHigh: b.refHigh })
      .onConflictDoNothing({ target: biomarkers.name });
    const [row] = await db.select({ id: biomarkers.id }).from(biomarkers).where(eq(biomarkers.name, b.name));
    ids.set(b.name, row.id);
  }

  const have = new Map<string, { readingId: string; value: number }>();
  if (ids.size) {
    const rows = await db
      .select({ readingId: readings.id, biomarkerId: readings.biomarkerId, takenAt: readings.takenAt, value: readings.value })
      .from(readings)
      .where(inArray(readings.biomarkerId, [...ids.values()]));
    for (const r of rows) if (r.value != null) have.set(`${r.biomarkerId} ${r.takenAt.slice(0, 7)}`, { readingId: r.readingId, value: Number(r.value) });
  }

  const inserts: (typeof readings.$inferInsert)[] = [];
  for (const m of months) {
    for (const b of CPAP_BIOMARKERS) {
      const value = m[b.key];
      const id = ids.get(b.name);
      if (value == null || !id) continue;
      const old = have.get(`${id} ${m.month}`);
      if (old === undefined) {
        inserts.push({ biomarkerId: id, value: String(value), takenAt: m.date, notes: b.note(m) });
        result.added.push(`${m.month} ${b.name} = ${value}`);
      } else if (old.value !== value) {
        await db.update(readings).set({ value: String(value), notes: b.note(m) }).where(eq(readings.id, old.readingId));
        result.updated.push(`${m.month} ${b.name}: ${old.value} -> ${value}`);
      } else result.skipped++;
    }
  }
  if (inserts.length) await db.insert(readings).values(inserts);
  if (inserts.length || result.updated.length) revalidatePath("/", "layout");
  return result;
}

// One sync run: the recent nights, then backfill months until myAir runs dry or `budgetMs` is used
// (the next run resumes from backfill_from), then publish. The outcome is stored for the Sleep page.
// `client` replaces the signed-in myAir client and `fetchImpl` the network (tests).
export async function runMyAirSync({
  budgetMs = 40_000,
  today = pacificToday(),
  client,
  fetchImpl = fetch,
}: { budgetMs?: number; today?: string; client?: MyAirClient; fetchImpl?: typeof fetch } = {}): Promise<MyAirSyncResult> {
  const started = Date.now();
  const result: MyAirSyncResult = {
    at: new Date().toISOString(),
    windows: [],
    latest: null,
    backfillFrom: null,
    backfillDone: false,
    more: false,
    warnings: [],
  };
  if (!client && !myAirConfigured())
    return { ...result, error: "not-configured", message: "MYAIR_USERNAME / MYAIR_PASSWORD are not set" };
  const db = getDb();
  const row = await authRow();
  let from = row.backfillFrom ?? firstOfMonth(today);
  let empty = row.backfillEmptyMonths;
  let done = row.backfillDone;
  result.backfillFrom = from;
  result.backfillDone = done;
  try {
    const c = client ?? retryingClient(row, fetchImpl);
    const [{ latest }] = await db.select({ latest: max(cpapNights.date) }).from(cpapNights);
    for (const w of monthWindows(recentFrom(latest, today), today))
      result.windows.push(await syncWindow(c, w.from, w.to, result.warnings));
    if (!row.backfillFrom) await setAuth({ backfillFrom: from });

    let stalled = false;
    // At least one month per run, so a run that starts late in its budget still moves.
    while (!done) {
      const month = previousMonth(from);
      if (month < BACKFILL_FLOOR) {
        done = true;
      } else {
        let w;
        try {
          w = await syncWindow(c, month, lastDayOfMonth(month.slice(0, 7)), result.warnings);
        } catch (e) {
          if (e instanceof MyAirAuthError || e instanceof MyAirStaleTokenError || e instanceof MfaRequiredError) throw e;
          // Leave the cursor where it is; the next run tries this month again.
          result.warnings.push(`backfill ${month.slice(0, 7)}: ${(e as Error).message}`);
          stalled = true;
          break;
        }
        result.windows.push(w);
        from = month;
        empty = w.nights ? 0 : empty + 1;
        if (empty >= BACKFILL_EMPTY_MONTHS) done = true;
      }
      await setAuth({ backfillFrom: from, backfillEmptyMonths: empty, backfillDone: done });
      if (Date.now() - started >= budgetMs) break;
    }
    result.backfillFrom = from;
    result.backfillDone = done;
    result.more = !done && !stalled;
    result.published = await publishCpapMonths(from, today);
  } catch (e) {
    result.error = e instanceof MfaRequiredError ? "mfa" : e instanceof MyAirAuthError ? "auth" : "failed";
    result.message = (e as Error).message;
    result.more = false;
  }
  const [{ latest }] = await db.select({ latest: max(cpapNights.date) }).from(cpapNights);
  result.latest = latest;
  await setAuth({ lastSyncAt: new Date(), lastSync: result });
  return result;
}

// Sign in and, when myAir asks for one, have it email the code. `sent` is false when no code is needed.
export async function sendMyAirCode(fetchImpl: typeof fetch = fetch): Promise<{ sent: boolean }> {
  const row = await authRow();
  const { username, password } = myAirCredentials();
  const auth = myAirAuth(MYAIR_NA, fetchImpl);
  const r = await auth.login(username, password, row.deviceToken);
  if (r.status === "SUCCESS") {
    await saveTokens(r.tokens, r.deviceToken);
    return { sent: false };
  }
  const { deviceToken } = await auth.sendCode(r.stateToken, r.verifyUrl, r.deviceToken);
  await setAuth({
    mfaStateToken: r.stateToken,
    mfaVerifyUrl: r.verifyUrl,
    mfaSentAt: new Date(),
    ...(deviceToken ? { deviceToken } : {}),
  });
  return { sent: true };
}

// Finish a sign-in with the emailed code. The device is remembered, so later syncs need no code.
export async function verifyMyAirCode(code: string, fetchImpl: typeof fetch = fetch) {
  const row = await authRow();
  if (!row.mfaStateToken || !row.mfaVerifyUrl) throw new MyAirAuthError("No code was requested: use Send code first");
  const clean = code.replace(/\s+/g, "");
  if (!/^\d{4,10}$/.test(clean)) throw new MyAirAuthError("Enter the digits from the myAir email");
  const r = await myAirAuth(MYAIR_NA, fetchImpl).verifyCode(row.mfaStateToken, row.mfaVerifyUrl, clean, row.deviceToken);
  await saveTokens(r.tokens, r.deviceToken);
}

export async function getMyAirStatus() {
  const [row] = await getDb()
    .select({
      backfillFrom: myairAuth.backfillFrom,
      backfillDone: myairAuth.backfillDone,
      mfaSentAt: myairAuth.mfaSentAt,
      lastSyncAt: myairAuth.lastSyncAt,
      lastSync: myairAuth.lastSync,
    })
    .from(myairAuth)
    .where(eq(myairAuth.id, 1));
  if (!row) return null;
  return { ...row, lastSync: row.lastSync as MyAirSyncResult | null };
}
