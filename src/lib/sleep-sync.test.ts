// The sync's database side against an in-memory Postgres (PGlite) and a fake Google client.
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { pushSchema } from "drizzle-kit/api";
import { eq } from "drizzle-orm";
import { beforeEach, test, vi } from "vitest";
import * as schema from "@/db/schema";
import type { HealthClient } from "@/lib/google";
import { ACTIVITY_SCOPE, METRICS_SCOPE, SLEEP_SCOPE } from "@/lib/google";
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
  await db.insert(googleAuth).values({ id: 1, refreshToken: "r", scope: [SLEEP_SCOPE, METRICS_SCOPE, ACTIVITY_SCOPE].join(" ") });
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
    async dailySpo2(from, to) {
      return inRange(from, to).map((d) => {
        const [year, month, day] = d.split("-").map(Number);
        return { dailyOxygenSaturation: { date: { year, month, day }, averagePercentage: d === "2026-10-05" ? 88 : 96 } };
      });
    },
    async dailyRespiratoryRate(from, to) {
      return inRange(from, to).map((d) => {
        const [year, month, day] = d.split("-").map(Number);
        return { dailyRespiratoryRate: { date: { year, month, day }, breathsPerMinute: 14 } };
      });
    },
    async dailySkinTemp(from, to) {
      return inRange(from, to).map((d) => {
        const [year, month, day] = d.split("-").map(Number);
        return {
          dailySleepTemperatureDerivations: { date: { year, month, day }, nightlyTemperatureCelsius: 33.5, baselineTemperatureCelsius: 33.25 },
        };
      });
    },
    async dailyVo2Max(from, to) {
      calls.push(`vo2 ${from}..${to}`);
      return inRange(from, to).map((d) => {
        const [year, month, day] = d.split("-").map(Number);
        return { dailyVo2Max: { date: { year, month, day }, vo2Max: 52 } };
      });
    },
    async heartRate() {
      return [50, 51, 49].map((bpm) => ({ heartRate: { beatsPerMinute: String(bpm) } }));
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
  assert.deepEqual(first.published?.updated, []);
  assert.equal(first.published?.skipped, 2);

  const { out, categories } = await readingsByName();
  assert.deepEqual([...categories], ["Sleep"]);
  assert.deepEqual(out[DURATION], ["2026-08-31=426", "2026-09-30=435", "2026-10-31=420"]);
  assert.deepEqual(out["Resting Heart Rate (Monthly)"], ["2026-08-31=50", "2026-09-30=50", "2026-10-31=50"]);
  assert.deepEqual(out["Heart Rate Variability (Monthly)"], ["2026-08-31=40", "2026-09-30=40", "2026-10-31=40"]);
  assert.deepEqual(out["Average Bedtime (Monthly)"], ["2026-08-31=23", "2026-09-30=23", "2026-10-31=23"]);
  assert.deepEqual(out["Average Wake Time (Monthly)"], ["2026-08-31=6.5", "2026-09-30=6.5", "2026-10-31=6.5"]);
  assert.deepEqual(out["Sleep Consistency (Monthly)"], ["2026-08-31=0", "2026-09-30=0", "2026-10-31=0"]);

  // Next day: rereads the last 3 days only, adds nothing, and replaces a changed month's duration.
  const again = await runSleepSync({ today: "2026-11-03", client: fakeGoogle((d) => (d === "2026-10-31" ? 451 : monthAsleep(d))) });
  assert.deepEqual(again.windows.map((w) => `${w.from}..${w.to}`), ["2026-10-31..2026-11-04"]);
  assert.deepEqual(again.published?.added, []);
  assert.deepEqual(again.published?.updated, ["2026-10 Average Daily Sleep Duration (Monthly): 420 -> 421"]);
  assert.deepEqual((await readingsByName()).out[DURATION], ["2026-08-31=426", "2026-09-30=435", "2026-10-31=421"]);

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

test("Google's sleep duration replaces differing hand-entered months", async () => {
  await seedHandEntered({ "2026-08-31": 380, "2026-09-30": 390 });
  await db.update(readings).set({ notes: "Typed in from the old spreadsheet" });
  const r = await runSleepSync({ today: TODAY, client: fakeGoogle(monthAsleep), budgetMs: 60_000 });
  assert.equal(r.published?.updated.length, 2);
  const notes = await db.select({ takenAt: readings.takenAt, notes: readings.notes }).from(readings).where(eq(readings.takenAt, "2026-08-31"));
  const aug = notes.find((n) => n.notes?.startsWith("Mean minutes asleep"));
  assert.ok(aug, `August duration note was not replaced: ${JSON.stringify(notes)}`);
  assert.match(aug.notes!, /over 31 nights' main sleep.*Google Health\.$/);
  assert.ok(!notes.some((n) => n.notes === "Typed in from the old spreadsheet"));
  const { out } = await readingsByName();
  assert.deepEqual(out[DURATION], ["2026-08-31=426", "2026-09-30=435", "2026-10-31=420"]);
  assert.deepEqual(out["Resting Heart Rate (Monthly)"], ["2026-08-31=50", "2026-09-30=50", "2026-10-31=50"]);
  assert.deepEqual(out["Heart Rate Variability (Monthly)"], ["2026-08-31=40", "2026-09-30=40", "2026-10-31=40"]);
  assert.deepEqual(out["Sleep Consistency (Monthly)"], ["2026-08-31=0", "2026-09-30=0", "2026-10-31=0"]);
  assert.deepEqual(out["Average Bedtime (Monthly)"], ["2026-08-31=23", "2026-09-30=23", "2026-10-31=23"]);
  assert.deepEqual(out["Average Wake Time (Monthly)"], ["2026-08-31=6.5", "2026-09-30=6.5", "2026-10-31=6.5"]);
});

test("a month hand-entered on a date other than its last day keeps its date", async () => {
  await seedHandEntered({ "2026-08-15": 426, "2026-10-01": 435 });
  const r = await runSleepSync({ today: TODAY, client: fakeGoogle(monthAsleep), budgetMs: 60_000 });
  assert.equal(r.published?.skipped, 1);
  assert.deepEqual(r.published?.updated, ["2026-10 Average Daily Sleep Duration (Monthly): 435 -> 420"]);
  assert.deepEqual((await readingsByName()).out[DURATION], ["2026-08-15=426", "2026-09-30=435", "2026-10-01=420"]);
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

test("publishes SpO2, respiratory rate, skin temperature, pre-sleep heart rate and VO2 max", async () => {
  await runSleepSync({ today: TODAY, client: fakeGoogle(monthAsleep), budgetMs: 60_000 });
  const { out } = await readingsByName();
  // Heart rate before sleep is read only for the 60 nights before today (from Sep 3), so August has none.
  assert.deepEqual(out["Overnight SpO2 (Monthly)"], ["2026-08-31=96", "2026-09-30=96", "2026-10-31=95.7"]);
  assert.deepEqual(out["Sleep Respiratory Rate (Monthly)"], ["2026-08-31=14", "2026-09-30=14", "2026-10-31=14"]);
  assert.deepEqual(out["Overnight Skin Temperature Variation (Monthly)"], ["2026-08-31=0.25", "2026-09-30=0.25", "2026-10-31=0.25"]);
  assert.deepEqual(out["VO2 Max (Fitbit estimate) (Monthly)"], ["2026-08-31=52", "2026-09-30=52", "2026-10-31=52", "2026-11-01=52"]);
  assert.deepEqual(out["Heart Rate Before Sleep (Monthly)"], ["2026-09-30=50", "2026-10-31=50"]);
  const [b] = await db.select().from(biomarkers).where(eq(biomarkers.name, "Heart Rate Before Sleep (Monthly)"));
  assert.equal(Number(b.refHigh), 50);
  const notes = await db
    .select({ notes: readings.notes })
    .from(readings)
    .innerJoin(biomarkers, eq(readings.biomarkerId, biomarkers.id))
    .where(eq(biomarkers.name, "Overnight SpO2 (Monthly)"));
  assert.ok(notes.some((n) => n.notes?.includes("lowest night 88%")));
});

test("the in-progress month is published as a labelled month-to-date value, then finalised", async () => {
  const g = fakeGoogle(monthAsleep);
  const mid = await runSleepSync({ today: "2026-10-20", client: g, budgetMs: 60_000 });
  assert.ok(mid.published?.added.includes("2026-10 Overnight SpO2 (Monthly) = 95.6 (month to date)"));
  const rows = () =>
    db
      .select({ takenAt: readings.takenAt, value: readings.value, notes: readings.notes })
      .from(readings)
      .innerJoin(biomarkers, eq(readings.biomarkerId, biomarkers.id))
      .where(eq(biomarkers.name, "Overnight SpO2 (Monthly)"));
  const [part] = (await rows()).filter((r) => r.takenAt.startsWith("2026-10"));
  assert.equal(part.takenAt, "2026-10-20");
  assert.match(part.notes!, /^Month to date \(through 2026-10-20/);
  // A later sync replaces it in place; once the month is over the final value and date take over.
  await runSleepSync({ today: "2026-11-02", client: g, budgetMs: 60_000 });
  const oct = (await rows()).filter((r) => r.takenAt.startsWith("2026-10"));
  assert.equal(oct.length, 1);
  assert.equal(oct[0].takenAt, "2026-10-31");
  assert.equal(Number(oct[0].value), 95.7);
  assert.ok(!oct[0].notes!.startsWith("Month to date"));
});

test("a sync version bump rescans all history once, then resumes from the cursor", async () => {
  const g = fakeGoogle(monthAsleep);
  await runSleepSync({ today: TODAY, client: g, budgetMs: 60_000 });
  await db.update(googleAuth).set({ sleepSyncVersion: 1 });
  const rescan = await runSleepSync({ today: TODAY, client: g, budgetMs: 0 });
  assert.equal(rescan.windows[0].from, "2010-01-01");
  assert.equal(rescan.more, true);
  // The reset is recorded with the new version, so the next run continues rather than restarting.
  const next = await runSleepSync({ today: TODAY, client: g, budgetMs: 0 });
  assert.equal(next.windows[0].from, "2010-12-30");
});

test("a grant without the activity scope still syncs everything but VO2 max and says to reconnect", async () => {
  await db.update(googleAuth).set({ scope: [SLEEP_SCOPE, METRICS_SCOPE].join(" ") });
  const g = fakeGoogle(monthAsleep);
  const r = await runSleepSync({ today: TODAY, client: g, budgetMs: 60_000 });
  assert.equal(r.error, undefined);
  assert.equal(r.needsActivityScope, true);
  assert.ok(!g.calls.some((c) => c.startsWith("vo2")));
  const { out } = await readingsByName();
  assert.equal(out["VO2 Max (Fitbit estimate) (Monthly)"], undefined);
  assert.equal(out["Overnight SpO2 (Monthly)"].length, 3);
  assert.equal(out["Resting Heart Rate (Monthly)"].length, 3);
});

test("a grant without the sleep scope asks for a reconnect", async () => {
  await db.update(googleAuth).set({ scope: "openid" });
  const r = await runSleepSync({ today: TODAY, client: fakeGoogle(monthAsleep) });
  assert.equal(r.error, "reconnect");
  assert.deepEqual(r.windows, []);
});
