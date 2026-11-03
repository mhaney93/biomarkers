// The sync's database side against an in-memory Postgres (PGlite) and a fake Google client.
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { pushSchema } from "drizzle-kit/api";
import { eq } from "drizzle-orm";
import { beforeEach, test, vi } from "vitest";
import * as schema from "@/db/schema";
import type { HealthClient } from "@/lib/google";
import { SLEEP_SCOPE } from "@/lib/google";
import type { SleepDataPoint } from "@/lib/sleep";

let db: ReturnType<typeof drizzle<typeof schema>>;
vi.mock("@/db", () => ({ getDb: () => db }));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

const { runSleepSync } = await import("@/lib/sleep-sync");
const { biomarkers, googleAuth, readings, sleepSessions } = schema;

const DURATION = "Average Daily Sleep Duration (Monthly)";
const TODAY = "2026-11-02";

beforeEach(async () => {
  db = drizzle(new PGlite(), { schema });
  const { apply } = await pushSchema(schema, db as never);
  await apply();
  await db.insert(googleAuth).values({ id: 1, refreshToken: "r", scope: SLEEP_SCOPE });
});

async function seedHandEntered(values: Record<string, number>) {
  const [b] = await db
    .insert(biomarkers)
    .values({ name: DURATION, valueType: "duration", category: "Sleep", refLow: "480", refHigh: "480" })
    .returning();
  await db.insert(readings).values(Object.entries(values).map(([takenAt, v]) => ({ biomarkerId: b.id, takenAt, value: String(v) })));
}

const civil = (iso: string) => {
  const d = new Date(Date.parse(iso) - 7 * 3600e3); // PDT
  return {
    date: { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() },
    time: { hours: d.getUTCHours(), minutes: d.getUTCMinutes() },
  };
};

// One main sleep per wake date from Aug 1 to Nov 1 2026, 23:00 -> 06:30 local, with
// `asleep(date)` minutes asleep; plus daily RHR 50 and HRV 40.
function fakeGoogle(asleep: (date: string) => number, drop: string[] = []): HealthClient & { calls: string[] } {
  const dates: string[] = [];
  for (let t = Date.parse("2026-08-01"); t <= Date.parse("2026-11-01"); t += 86400e3) dates.push(new Date(t).toISOString().slice(0, 10));
  const inRange = (from: string, to: string) => dates.filter((d) => d >= from && d < to);
  const calls: string[] = [];
  return {
    calls,
    async sleep(from, to) {
      calls.push(`${from}..${to}`);
      return inRange(from, to)
        .filter((d) => !drop.includes(d))
        .map((d): SleepDataPoint => {
          const end = `${d}T13:30:00Z`;
          const start = new Date(Date.parse(end) - 450 * 60e3).toISOString();
          return {
            name: `users/me/dataTypes/sleep/dataPoints/s-${d}`,
            sleep: {
              interval: { startTime: start, endTime: end, civilStartTime: civil(start), civilEndTime: civil(end) },
              metadata: { mainSleep: true, nap: false },
              summary: { minutesAsleep: String(asleep(d)), minutesInSleepPeriod: "450" },
            },
          };
        });
    },
    async dailyRestingHeartRate(from, to) {
      return inRange(from, to).map((d) => {
        const [year, month, day] = d.split("-").map(Number);
        return { dailyRestingHeartRate: { date: { year, month, day }, beatsPerMinute: "50" } };
      });
    },
    async dailyHrv(from, to) {
      return inRange(from, to).map((d) => {
        const [year, month, day] = d.split("-").map(Number);
        return { dailyHeartRateVariability: { date: { year, month, day }, averageHeartRateVariabilityMilliseconds: 40 } };
      });
    },
  };
}

const byMonth: Record<string, number> = { "2026-08": 426, "2026-09": 435, "2026-10": 420, "2026-11": 400 };
const monthAsleep = (d: string) => byMonth[d.slice(0, 7)];

async function readingsByName() {
  const rows = await db
    .select({ name: biomarkers.name, category: biomarkers.category, takenAt: readings.takenAt, value: readings.value })
    .from(readings)
    .innerJoin(biomarkers, eq(readings.biomarkerId, biomarkers.id));
  const out: Record<string, string[]> = {};
  for (const r of rows) (out[r.name] ??= []).push(`${r.takenAt}=${Number(r.value)}`);
  for (const k in out) out[k].sort();
  return { out, categories: new Set(rows.map((r) => r.category)) };
}

test("backfill publishes missing months, keeps hand-entered ones, then stays idempotent", async () => {
  await seedHandEntered({ "2026-08-31": 426, "2026-09-30": 435 });
  const g = fakeGoogle(monthAsleep);
  const first = await runSleepSync({ today: TODAY, client: g, budgetMs: 60_000 });
  assert.equal(first.error, undefined);
  assert.equal(first.more, false);
  assert.equal(first.syncedTo, "2026-11-03");
  assert.equal(g.calls[0], "2010-01-01..2011-01-02");
  assert.equal(first.published?.held, false);
  assert.deepEqual(first.published?.comparison.rows.map((r) => r.diff), [0, 0]);
  assert.equal(first.published?.skipped, 2);

  const { out, categories } = await readingsByName();
  assert.deepEqual([...categories], ["Sleep"]);
  assert.deepEqual(out[DURATION], ["2026-08-31=426", "2026-09-30=435", "2026-10-31=420"]);
  assert.deepEqual(out["Resting Heart Rate (Monthly)"], ["2026-08-31=50", "2026-09-30=50", "2026-10-31=50"]);
  assert.deepEqual(out["Heart Rate Variability (Monthly)"], ["2026-08-31=40", "2026-09-30=40", "2026-10-31=40"]);
  assert.deepEqual(out["Average Bedtime (Monthly)"], ["2026-08-31=23", "2026-09-30=23", "2026-10-31=23"]);
  assert.deepEqual(out["Average Wake Time (Monthly)"], ["2026-08-31=6.5", "2026-09-30=6.5", "2026-10-31=6.5"]);
  assert.deepEqual(out["Sleep Consistency (Monthly)"], ["2026-08-31=0", "2026-09-30=0", "2026-10-31=0"]);

  // Next day: rereads the last 3 days only, adds nothing, and reports (doesn't overwrite) a changed month.
  const again = await runSleepSync({ today: "2026-11-03", client: fakeGoogle((d) => (d === "2026-10-31" ? 451 : monthAsleep(d))) });
  assert.deepEqual(again.windows.map((w) => `${w.from}..${w.to}`), ["2026-10-31..2026-11-04"]);
  assert.deepEqual(again.published?.added, []);
  assert.deepEqual(again.published?.changed, ["2026-10 Average Daily Sleep Duration (Monthly): site 420, Google 421"]);
  assert.deepEqual((await readingsByName()).out[DURATION], ["2026-08-31=426", "2026-09-30=435", "2026-10-31=420"]);

  const [auth] = await db.select().from(googleAuth);
  assert.equal(auth.sleepSyncedTo, "2026-11-04");
  assert.ok(auth.lastSyncAt);
});

test("a night Google no longer returns is dropped from its window", async () => {
  await runSleepSync({ today: TODAY, client: fakeGoogle(monthAsleep), budgetMs: 60_000 });
  await runSleepSync({ today: TODAY, client: fakeGoogle(monthAsleep, ["2026-11-01"]) });
  const left = await db.select({ d: sleepSessions.wakeDate }).from(sleepSessions).where(eq(sleepSessions.wakeDate, "2026-11-01"));
  assert.deepEqual(left, []);
});

test("only sleep duration is held when computed durations disagree with the hand-entered months", async () => {
  await seedHandEntered({ "2026-08-31": 380, "2026-09-30": 390 });
  const r = await runSleepSync({ today: TODAY, client: fakeGoogle(monthAsleep), budgetMs: 60_000 });
  assert.equal(r.published?.held, true);
  assert.equal(r.published?.comparison.medianAbsDiff, 45.5);
  const { out } = await readingsByName();
  assert.deepEqual(out[DURATION], ["2026-08-31=380", "2026-09-30=390"]);
  assert.deepEqual(out["Resting Heart Rate (Monthly)"], ["2026-08-31=50", "2026-09-30=50", "2026-10-31=50"]);
  assert.deepEqual(out["Heart Rate Variability (Monthly)"], ["2026-08-31=40", "2026-09-30=40", "2026-10-31=40"]);
  assert.deepEqual(out["Sleep Consistency (Monthly)"], ["2026-08-31=0", "2026-09-30=0", "2026-10-31=0"]);
  assert.deepEqual(out["Average Bedtime (Monthly)"], ["2026-08-31=23", "2026-09-30=23", "2026-10-31=23"]);
  assert.deepEqual(out["Average Wake Time (Monthly)"], ["2026-08-31=6.5", "2026-09-30=6.5", "2026-10-31=6.5"]);
});

test("a month hand-entered on a date other than its last day is not written again", async () => {
  await seedHandEntered({ "2026-08-15": 426, "2026-10-01": 435 });
  const r = await runSleepSync({ today: TODAY, client: fakeGoogle(monthAsleep), budgetMs: 60_000 });
  assert.deepEqual(r.published?.comparison.rows.map((row) => `${row.month} ${row.diff}`), ["2026-08 0", "2026-10 -15"]);
  assert.equal(r.published?.skipped, 1);
  assert.deepEqual(r.published?.changed, ["2026-10 Average Daily Sleep Duration (Monthly): site 435, Google 420"]);
  assert.deepEqual((await readingsByName()).out[DURATION], ["2026-08-15=426", "2026-09-30=435", "2026-10-01=435"]);
});

test("a small time budget stops after one window and resumes from the cursor", async () => {
  const g = fakeGoogle(monthAsleep);
  const r = await runSleepSync({ today: TODAY, client: g, budgetMs: 0 });
  assert.equal(r.more, true);
  assert.equal(r.published, undefined);
  assert.equal(r.syncedTo, "2011-01-02");
  const next = await runSleepSync({ today: TODAY, client: g, budgetMs: 0 });
  assert.equal(next.windows[0].from, "2010-12-30");
});

test("a grant without the sleep scope asks for a reconnect", async () => {
  await db.update(googleAuth).set({ scope: "openid" });
  const r = await runSleepSync({ today: TODAY, client: fakeGoogle(monthAsleep) });
  assert.equal(r.error, "reconnect");
  assert.deepEqual(r.windows, []);
});
