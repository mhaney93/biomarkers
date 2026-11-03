import assert from "node:assert/strict";
import { test } from "vitest";
import {
  BIOMARKERS,
  MIN_DAYS,
  clock,
  compareDurations,
  completeBefore,
  lastDayOfMonth,
  mapDaily,
  mapSleep,
  monthly,
  nextWindow,
  nights,
  pacificToday,
  type SleepDataPoint,
  type SleepSession,
} from "./sleep";

// Shape from the Google Health v4 discovery document (int64s as strings).
const night: SleepDataPoint = {
  name: "users/1234567890/dataTypes/sleep/dataPoints/3f6b2a10-9c1e-4d1b-a8f2-0c7e5d9b1a42",
  dataSource: { recordingMethod: "PASSIVELY_MEASURED", device: { displayName: "Pixel Watch 4" }, platform: "FITBIT" },
  sleep: {
    interval: {
      startTime: "2026-10-15T06:42:30Z",
      startUtcOffset: "-25200s",
      endTime: "2026-10-15T13:51:00Z",
      endUtcOffset: "-25200s",
      civilStartTime: { date: { year: 2026, month: 10, day: 14 }, time: { hours: 23, minutes: 42, seconds: 30 } },
      civilEndTime: { date: { year: 2026, month: 10, day: 15 }, time: { hours: 6, minutes: 51 } },
    },
    type: "STAGES",
    stages: [{ type: "LIGHT" }],
    metadata: { processed: true, mainSleep: true, nap: false },
    summary: { minutesInSleepPeriod: "428", minutesAsleep: "391", minutesAwake: "37" },
  },
};

test("mapSleep reads civil times, string int64s and the wake date", () => {
  const s = mapSleep(night);
  assert.equal(s.sleepId, "3f6b2a10-9c1e-4d1b-a8f2-0c7e5d9b1a42");
  assert.equal(s.wakeDate, "2026-10-15");
  assert.equal(s.bedMinute, 23 * 60 + 43); // 23:42:30 rounds up
  assert.equal(s.wakeMinute, 6 * 60 + 51);
  assert.equal(s.minutesAsleep, 391);
  assert.equal(s.minutesInPeriod, 428);
  assert.equal(s.mainSleep, true);
  assert.equal(s.nap, false);
  assert.equal(s.device, "Pixel Watch 4");
  assert.equal("stages" in (s.raw as object), false);
});

test("mapSleep falls back to the UTC offset when civil times are missing", () => {
  const { civilStartTime, civilEndTime, ...interval } = night.sleep.interval;
  void civilStartTime;
  void civilEndTime;
  const s = mapSleep({ ...night, sleep: { ...night.sleep, interval } });
  assert.equal(s.wakeDate, "2026-10-15");
  assert.equal(s.bedMinute, 23 * 60 + 43);
  assert.equal(s.wakeMinute, 6 * 60 + 51);
});

test("mapDaily merges resting HR and HRV by date", () => {
  const days = mapDaily(
    [{ dailyRestingHeartRate: { date: { year: 2026, month: 10, day: 15 }, beatsPerMinute: "52" } }],
    [
      { dailyHeartRateVariability: { date: { year: 2026, month: 10, day: 15 }, averageHeartRateVariabilityMilliseconds: 48.7 } },
      { dailyHeartRateVariability: { date: { year: 2026, month: 10, day: 16 }, averageHeartRateVariabilityMilliseconds: 51 } },
    ],
  );
  assert.deepEqual(days, [
    { date: "2026-10-15", restingHr: 52, hrvMs: 48.7 },
    { date: "2026-10-16", restingHr: null, hrvMs: 51 },
  ]);
});

// A session ending on `date` at `wake` (minutes) that started `asleep + 20` minutes before.
function session(date: string, bed: number, wake: number, asleep: number, extra: Partial<SleepSession> = {}) {
  const end = Date.parse(`${date}T00:00:00Z`) + wake * 60e3;
  const start = end - (asleep + 20) * 60e3;
  return {
    wakeDate: date,
    startTime: new Date(start).toISOString(),
    endTime: new Date(end).toISOString(),
    bedMinute: bed,
    wakeMinute: wake,
    minutesAsleep: asleep,
    mainSleep: true,
    nap: false,
    ...extra,
  };
}

test("nights sums naps, counts a duplicate session once, and wraps after-midnight bedtimes", () => {
  const main = session("2026-10-02", 30, 7 * 60, 400);
  const dup = { ...main, minutesAsleep: 390, mainSleep: false }; // same night from another source
  const nap = session("2026-10-02", 14 * 60, 14 * 60 + 40, 20, { mainSleep: false, nap: true });
  const napOnly = session("2026-10-03", 14 * 60, 14 * 60 + 40, 20, { mainSleep: false, nap: true });
  assert.deepEqual(nights([main, dup, nap, napOnly]), [{ date: "2026-10-02", asleep: 420, bed: 1470, wake: 420 }]);
});

test("monthly averages, SDs, consistency and the MIN_DAYS threshold", () => {
  const sessions = [];
  const daily = [];
  for (let d = 1; d <= MIN_DAYS; d++) {
    const date = `2026-10-${String(d).padStart(2, "0")}`;
    // Bedtimes alternate 23:00 / 00:00, wake times 6:00 / 7:00.
    const even = d % 2 === 0;
    sessions.push(session(date, even ? 0 : 23 * 60, even ? 7 * 60 : 6 * 60, even ? 450 : 390));
    daily.push({ date, restingHr: 50 + (even ? 2 : 0), hrvMs: d === 1 ? 40 : null });
  }
  sessions.push(session("2026-09-30", 23 * 60, 7 * 60, 400)); // September: 1 night, not published
  sessions.push(session("2026-11-01", 23 * 60, 7 * 60, 400)); // November: not complete

  const months = monthly(sessions, daily, "2026-11");
  assert.deepEqual(
    months.map((m) => m.month),
    ["2026-09", "2026-10"],
  );
  const [sep, oct] = months;
  assert.equal(sep.duration, null);
  assert.equal(sep.consistency, null);
  assert.equal(oct.date, "2026-10-31");
  assert.equal(oct.nights, 10);
  assert.equal(oct.duration, 420);
  assert.equal(oct.bedSd, 30);
  assert.equal(oct.wakeSd, 30);
  assert.equal(oct.consistency, 30);
  assert.equal(oct.bedtime, 23.5); // mean of 23:00 and 24:00
  assert.equal(oct.wake, 6.5);
  assert.equal(oct.restingHr, 51);
  assert.equal(oct.hrv, null); // only 1 day of HRV
  assert.equal(oct.hrvDays, 1);
});

test("every biomarker note renders from a month's values", () => {
  const sessions = Array.from({ length: MIN_DAYS }, (_, i) => session(`2026-10-${String(i + 1).padStart(2, "0")}`, 23 * 60, 6 * 60, 400));
  const daily = sessions.map((s) => ({ date: s.wakeDate, restingHr: 50, hrvMs: 45 }));
  const [oct] = monthly(sessions, daily, "2026-11");
  for (const b of BIOMARKERS) {
    assert.notEqual(oct[b.key], null, b.name);
    assert.match(b.note(oct), /Google Health/);
  }
  assert.match(BIOMARKERS.find((b) => b.key === "bedtime")!.note(oct), /11:00 PM/);
});

test("compareDurations holds publishing on a material median gap", () => {
  const month = (m: string, duration: number) => ({ month: m, date: lastDayOfMonth(m), duration }) as never;
  const site = new Map([
    ["2026-08-31", 426],
    ["2026-09-30", 435],
    ["2026-07-31", 435],
  ]);
  const close = compareDurations([month("2026-07", 440), month("2026-08", 420), month("2026-09", 435), month("2026-10", 300)], site);
  assert.equal(close.ok, true);
  assert.equal(close.medianAbsDiff, 5);
  assert.deepEqual(
    close.rows.map((r) => r.diff),
    [5, -6, 0],
  );
  const far = compareDurations([month("2026-07", 470), month("2026-08", 460), month("2026-09", 435)], site);
  assert.equal(far.ok, false);
  assert.equal(compareDurations([month("2026-10", 300)], site).ok, true); // nothing overlaps
});

test("nextWindow scans a year at a time, then rereads the last 3 days", () => {
  assert.deepEqual(nextWindow(null, "2026-11-02"), { from: "2010-01-01", to: "2011-01-02", more: true });
  assert.deepEqual(nextWindow("2026-06-01", "2026-11-02"), { from: "2026-05-29", to: "2026-11-03", more: false });
  assert.deepEqual(nextWindow("2026-11-03", "2026-11-02"), { from: "2026-10-31", to: "2026-11-03", more: false });
});

test("completeBefore waits for both the calendar and the scan", () => {
  assert.equal(completeBefore("2026-11-03", "2026-11-02"), "2026-11");
  assert.equal(completeBefore("2026-10-15", "2026-11-02"), "2026-10");
  assert.equal(completeBefore("2026-11-01", "2026-11-02"), "2026-11"); // scan covered Oct 31
});

test("date helpers", () => {
  assert.equal(lastDayOfMonth("2025-02"), "2025-02-28");
  assert.equal(lastDayOfMonth("2024-02"), "2024-02-29");
  assert.equal(clock(1470), "12:30 AM");
  assert.equal(clock(23 * 60 + 5), "11:05 PM");
  assert.equal(pacificToday(new Date("2026-11-01T06:30:00Z")), "2026-10-31");
});
