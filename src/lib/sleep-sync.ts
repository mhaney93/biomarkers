// The sleep sync: pull nights and daily RHR / HRV from Google Health into sleep_sessions and
// daily_health, a year-long window at a time from a resumable cursor, then write each completed
// month's values to the "Sleep" biomarkers. Run by the daily cron and the "Sync now" button.
import { and, eq, gte, inArray, lt, notInArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { biomarkers, dailyHealth, googleAuth, readings, sleepSessions } from "@/db/schema";
import {
  BIOMARKERS,
  CATEGORY,
  PRE_SLEEP_DAYS,
  addDays,
  completeBefore,
  mapDaily,
  mapSleep,
  monthly,
  nextWindow,
  pacificToday,
  preSleepBpm,
  preSleepWindow,
  type SleepSession,
} from "@/lib/sleep";
import {
  ACTIVITY_SCOPE,
  ReconnectError,
  SLEEP_SCOPE,
  hasScope,
  healthClient,
  refreshAccessToken,
  type HealthClient,
} from "@/lib/google";

export type PublishResult = {
  before: string;
  added: string[];
  updated: string[];
  skipped: number;
};

export type SyncResult = {
  at: string;
  error?: "not-connected" | "reconnect" | "failed";
  message?: string;
  windows: { from: string; to: string; sessions: number; days: number }[];
  syncedTo: string | null;
  more: boolean;
  warnings: string[];
  // The grant lacks the activity scope, so VO2 max was not read (everything else was).
  needsActivityScope?: boolean;
  published?: PublishResult;
};

export async function getGoogleStatus() {
  const [row] = await getDb()
    .select({
      scope: googleAuth.scope,
      connectedAt: googleAuth.connectedAt,
      sleepSyncedTo: googleAuth.sleepSyncedTo,
      lastSyncAt: googleAuth.lastSyncAt,
      lastSync: googleAuth.lastSync,
    })
    .from(googleAuth)
    .where(eq(googleAuth.id, 1));
  if (!row) return null;
  return { ...row, lastSync: row.lastSync as SyncResult | null, hasSleepScope: hasScope(row.scope, SLEEP_SCOPE),
    hasActivityScope: hasScope(row.scope, ACTIVITY_SCOPE),
  };
}

export async function saveGoogleTokens(refreshToken: string, scope: string | null) {
  await getDb()
    .insert(googleAuth)
    .values({ id: 1, refreshToken, scope })
    .onConflictDoUpdate({
      target: googleAuth.id,
      set: { refreshToken, scope, connectedAt: sql`now()` },
    });
}

export async function storedRefreshToken() {
  const [row] = await getDb().select({ t: googleAuth.refreshToken }).from(googleAuth).where(eq(googleAuth.id, 1));
  return row?.t ?? null;
}

const excluded = (column: string) => sql.raw(`excluded.${column}`);

// Read one window and replace what is stored for its wake dates (Google re-scores and merges
// sessions, so ones it dropped go too). One statement per table: a window can hold a year.
async function syncWindow(
  g: HealthClient,
  from: string,
  to: string,
  warnings: string[],
  { today, activity }: { today: string; activity: boolean },
) {
  const db = getDb();
  const sessions: SleepSession[] = [];
  for (const dp of await g.sleep(from, to)) {
    try {
      sessions.push(mapSleep(dp));
    } catch (e) {
      warnings.push(`sleep ${dp?.name}: ${(e as Error).message}`);
    }
  }
  const optional = async <T,>(label: string, f: () => Promise<T[]>) => {
    try {
      return await f();
    } catch (e) {
      if (e instanceof ReconnectError) throw e;
      warnings.push(`${label}: ${(e as Error).message}`);
      return [];
    }
  };
  const resting = await optional("resting heart rate", () => g.dailyRestingHeartRate(from, to));
  const hrv = await optional("hrv", () => g.dailyHrv(from, to));
  const spo2 = await optional("overnight SpO2", () => g.dailySpo2(from, to));
  const respiratoryRate = await optional("respiratory rate", () => g.dailyRespiratoryRate(from, to));
  const skinTemp = await optional("skin temperature", () => g.dailySkinTemp(from, to));
  const vo2Max = activity ? await optional("VO2 max", () => g.dailyVo2Max(from, to)) : [];
  // Heart rate before each recent main sleep (one request per night, so only the last PRE_SLEEP_DAYS).
  const preSleep: { date: string; bpm: number }[] = [];
  const recent = addDays(today, -PRE_SLEEP_DAYS);
  for (const s of sessions.filter((x) => x.mainSleep && !x.nap && x.wakeDate >= recent)) {
    const w = preSleepWindow(s.startTime);
    const bpm = preSleepBpm(await optional(`heart rate before sleep ${s.wakeDate}`, () => g.heartRate(w.from, w.to)));
    if (bpm != null) preSleep.push({ date: s.wakeDate, bpm });
  }

  const unique = [...new Map(sessions.map((s) => [s.sleepId, s])).values()];
  await db
    .delete(sleepSessions)
    .where(
      and(
        gte(sleepSessions.wakeDate, from),
        lt(sleepSessions.wakeDate, to),
        notInArray(
          sleepSessions.sleepId,
          unique.map((s) => s.sleepId),
        ),
      ),
    );
  if (unique.length) {
    await db
      .insert(sleepSessions)
      .values(unique)
      .onConflictDoUpdate({
        target: sleepSessions.sleepId,
        set: {
          wakeDate: excluded("wake_date"),
          startTime: excluded("start_time"),
          endTime: excluded("end_time"),
          bedMinute: excluded("bed_minute"),
          wakeMinute: excluded("wake_minute"),
          minutesAsleep: excluded("minutes_asleep"),
          mainSleep: excluded("main_sleep"),
          nap: excluded("nap"),
          syncedAt: sql`now()`,
        },
      });
  }
  const days = mapDaily(resting, hrv, { spo2, respiratoryRate, skinTemp, vo2Max, preSleep });
  if (days.length) {
    await db
      .insert(dailyHealth)
      .values(days)
      .onConflictDoUpdate({
        target: dailyHealth.date,
        set: {
          restingHr: sql`coalesce(excluded.resting_hr, ${dailyHealth.restingHr})`,
          hrvMs: sql`coalesce(excluded.hrv_ms, ${dailyHealth.hrvMs})`,
          spo2Pct: sql`coalesce(excluded.spo2_pct, ${dailyHealth.spo2Pct})`,
          respRate: sql`coalesce(excluded.resp_rate, ${dailyHealth.respRate})`,
          skinTempDeltaC: sql`coalesce(excluded.skin_temp_delta_c, ${dailyHealth.skinTempDeltaC})`,
          preSleepHr: sql`coalesce(excluded.pre_sleep_hr, ${dailyHealth.preSleepHr})`,
          vo2Max: sql`coalesce(excluded.vo2_max, ${dailyHealth.vo2Max})`,
          syncedAt: sql`now()`,
        },
      });
  }
  return { from, to, sessions: unique.length, days: days.length };
}

// Write each completed month's values. A month a biomarker already has a reading for (on any
// date in that month) is not written again, except sleep duration: Google's value replaces a
// different one there (keeping the reading's date; its note is replaced), reported in `updated`.
export async function publishMonths(cursor: string, today = pacificToday()): Promise<PublishResult> {
  const db = getDb();
  const before = completeBefore(cursor, today);
  const sessions = await db
    .select({
      wakeDate: sleepSessions.wakeDate,
      startTime: sleepSessions.startTime,
      endTime: sleepSessions.endTime,
      bedMinute: sleepSessions.bedMinute,
      wakeMinute: sleepSessions.wakeMinute,
      minutesAsleep: sleepSessions.minutesAsleep,
      mainSleep: sleepSessions.mainSleep,
      nap: sleepSessions.nap,
    })
    .from(sleepSessions);
  const daily = await db
    .select({
      date: dailyHealth.date,
      restingHr: dailyHealth.restingHr,
      hrvMs: dailyHealth.hrvMs,
      spo2Pct: dailyHealth.spo2Pct,
      respRate: dailyHealth.respRate,
      skinTempDeltaC: dailyHealth.skinTempDeltaC,
      preSleepHr: dailyHealth.preSleepHr,
      vo2Max: dailyHealth.vo2Max,
    })
    .from(dailyHealth);
  const months = monthly(sessions, daily, before);

  const existing = await db
    .select({ id: biomarkers.id, name: biomarkers.name })
    .from(biomarkers)
    .where(inArray(biomarkers.name, BIOMARKERS.map((b) => b.name)));
  const ids = new Map(existing.map((b) => [b.name, b.id]));
  const have = new Map<string, { readingId: string; value: number }>();
  if (ids.size) {
    const rows = await db
      .select({ readingId: readings.id, biomarkerId: readings.biomarkerId, takenAt: readings.takenAt, value: readings.value })
      .from(readings)
      .where(inArray(readings.biomarkerId, [...ids.values()]));
    for (const r of rows) if (r.value != null) have.set(`${r.biomarkerId} ${r.takenAt.slice(0, 7)}`, { readingId: r.readingId, value: Number(r.value) });
  }

  const result: PublishResult = { before, added: [], updated: [], skipped: 0 };

  for (const b of BIOMARKERS) {
    if (ids.has(b.name) || !months.some((m) => m[b.key] != null)) continue;
    await db
      .insert(biomarkers)
      .values({ name: b.name, unit: b.unit, valueType: b.valueType, category: CATEGORY, refLow: b.refLow, refHigh: b.refHigh })
      .onConflictDoNothing({ target: biomarkers.name });
    const [row] = await db.select({ id: biomarkers.id }).from(biomarkers).where(eq(biomarkers.name, b.name));
    ids.set(b.name, row.id);
  }

  const inserts: (typeof readings.$inferInsert)[] = [];
  for (const m of months) {
    for (const b of BIOMARKERS) {
      const value = m[b.key];
      const id = ids.get(b.name);
      if (value == null || !id) continue;
      const old = have.get(`${id} ${m.month}`);
      if (old !== undefined) {
        if (old.value !== value && b.key === "duration") {
          await db.update(readings).set({ value: String(value), notes: b.note(m) }).where(eq(readings.id, old.readingId));
          result.updated.push(`${m.month} ${b.name}: ${old.value} -> ${value}`);
        } else result.skipped++;
        continue;
      }
      inserts.push({ biomarkerId: id, value: String(value), takenAt: m.date, notes: b.note(m) });
      result.added.push(`${m.month} ${b.name} = ${value}`);
    }
  }
  if (inserts.length) await db.insert(readings).values(inserts);
  if (inserts.length || result.updated.length) {
    revalidatePath("/", "layout");
  }
  return result;
}

// One sync run: scan windows until caught up or `budgetMs` is used (the next run resumes from the
// cursor), then publish once the scan has reached today. The outcome is stored for the Sleep page.
// `client` replaces the Google client built from the stored refresh token (tests).
export async function runSleepSync({
  budgetMs = 40_000,
  today = pacificToday(),
  client,
}: { budgetMs?: number; today?: string; client?: HealthClient } = {}): Promise<SyncResult> {
  const started = Date.now();
  const db = getDb();
  const result: SyncResult = { at: new Date().toISOString(), windows: [], syncedTo: null, more: false, warnings: [] };
  const [row] = await db.select().from(googleAuth).where(eq(googleAuth.id, 1));
  if (!row) return { ...result, error: "not-connected", message: "Google is not connected" };
  let cursor = row.sleepSyncedTo;
  result.syncedTo = cursor;
  try {
    if (!hasScope(row.scope, SLEEP_SCOPE)) throw new ReconnectError("The Google grant does not include sleep data");
    const activity = hasScope(row.scope, ACTIVITY_SCOPE);
    if (!activity) result.needsActivityScope = true;
    const g = client ?? healthClient((await refreshAccessToken(row.refreshToken)).access_token);
    do {
      const w = nextWindow(cursor, today);
      result.windows.push(await syncWindow(g, w.from, w.to, result.warnings, { today, activity }));
      cursor = w.to;
      result.more = w.more;
      await db.update(googleAuth).set({ sleepSyncedTo: cursor }).where(eq(googleAuth.id, 1));
    } while (result.more && Date.now() - started < budgetMs);
    result.syncedTo = cursor;
    if (!result.more && cursor) result.published = await publishMonths(cursor, today);
  } catch (e) {
    result.error = e instanceof ReconnectError ? "reconnect" : "failed";
    result.message = (e as Error).message;
  }
  await db.update(googleAuth).set({ lastSyncAt: sql`now()`, lastSync: result }).where(eq(googleAuth.id, 1));
  return result;
}
