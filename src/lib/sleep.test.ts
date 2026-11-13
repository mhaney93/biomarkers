import assert from "node:assert/strict";
import { test } from "vitest";
import {
  BIOMARKERS,
  MIN_DAYS,
  clock,
  completeBefore,
  lastDayOfMonth,
  mapDaily,
  mapSleep,
  monthly,
  nextWindow,
  nights,
  pacificToday,
  preSleepBpm,
  preSleepWindow,
  type DailyHealth,
  type SleepDataPoint,
  type SleepSession,
} from "./sleep";

const EMPTY_DAY: DailyHealth = {
  date: "",
  restingHr: null,
  hrvMs: null,
  spo2Pct: null,
  respRate: null,
  skinTempDeltaC: null,
  preSleepHr: null,
  vo2Max: null,
};

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
  assert.equal(s.mainSleep, true);
  assert.equal(s.nap, false);
});

// A STAGES session's segments from 23:00 local (06:00Z): minutes per segment.
function staged(segments: [string, number][], summary = true): SleepDataPoint {
  let t = Date.parse("2026-10-15T06:00:00Z");
  const stages = segments.map(([type, min]) => {
    const seg = { type, startTime: new Date(t).toISOString(), endTime: new Date(t + min * 60e3).toISOString() };
    t += min * 60e3;
    return seg;
  });
  const total = (type: string) => segments.filter(([x]) => x === type).reduce((a, [, m]) => a + m, 0);
  return {
    ...night,
    sleep: {
      ...night.sleep,
      type: "STAGES",
      stages,
      summary: {
        ...night.sleep.summary,
        minutesToFallAsleep: "0",
        stagesSummary: summary
          ? ["AWAKE", "LIGHT", "DEEP", "REM"].map((type) => ({ type, minutes: String(total(type)), count: "1" }))
          : undefined,
      },
    },
  };
}

test("mapSleep reads stage minutes, awake time after sleep onset and awakenings from a STAGES session", () => {
  // 12 min awake before falling asleep and 3 at the end are not WASO; 7 + 4 + 6 min in between are.
  const segs: [string, number][] = [
    ["AWAKE", 12], ["LIGHT", 100], ["AWAKE", 7], ["DEEP", 60], ["AWAKE", 4], ["REM", 50], ["AWAKE", 6], ["LIGHT", 90], ["AWAKE", 3],
  ];
  const s = mapSleep(staged(segs));
  assert.deepEqual(
    [s.sleepType, s.deepMinutes, s.remMinutes, s.lightMinutes, s.wasoMinutes, s.awakenings, s.minutesToFallAsleep],
    ["STAGES", 60, 50, 190, 17, 2, 0],
  );
  // Without a stages summary the minutes come from the segments.
  const t = mapSleep(staged(segs, false));
  assert.deepEqual([t.deepMinutes, t.remMinutes, t.lightMinutes], [60, 50, 190]);
});

test("mapSleep leaves stage fields empty for a CLASSIC session", () => {
  const s = mapSleep({
    ...night,
    sleep: { ...night.sleep, type: "CLASSIC", stages: [{ type: "ASLEEP", startTime: night.sleep.interval.startTime, endTime: night.sleep.interval.endTime }] },
  });
  assert.equal(s.sleepType, "CLASSIC");
  assert.deepEqual([s.deepMinutes, s.remMinutes, s.lightMinutes, s.wasoMinutes, s.awakenings], [null, null, null, null, null]);
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
    { ...EMPTY_DAY, date: "2026-10-15", restingHr: 52, hrvMs: 48.7 },
    { ...EMPTY_DAY, date: "2026-10-16", hrvMs: 51 },
  ]);
});

test("mapDaily maps SpO2, respiratory rate, skin temperature variation, VO2 max and pre-sleep heart rate", () => {
  const date = { year: 2026, month: 10, day: 15 };
  const days = mapDaily([], [], {
    spo2: [{ dailyOxygenSaturation: { date, averagePercentage: 95.4 } }],
    respiratoryRate: [{ dailyRespiratoryRate: { date, breathsPerMinute: 14.2 } }],
    skinTemp: [{ dailySleepTemperatureDerivations: { date, nightlyTemperatureCelsius: 33.9, baselineTemperatureCelsius: 33.4 } }],
    vo2Max: [{ dailyVo2Max: { date, vo2Max: 52.5 } }],
    preSleep: [{ date: "2026-10-15", bpm: 49.5 }],
  });
  assert.deepEqual(days, [
    { ...EMPTY_DAY, date: "2026-10-15", spo2Pct: 95.4, respRate: 14.2, skinTempDeltaC: 0.5, vo2Max: 52.5, preSleepHr: 49.5 },
  ]);
  // A skin temperature without its baseline says nothing about variation.
  assert.deepEqual(
    mapDaily([], [], { skinTemp: [{ dailySleepTemperatureDerivations: { date, nightlyTemperatureCelsius: 33.9 } }] }),
    [],
  );
});

test("preSleepBpm averages the window's samples and needs a few of them", () => {
  const hr = (bpm: number | string) => ({ heartRate: { beatsPerMinute: bpm } });
  assert.equal(preSleepBpm([hr("50"), hr(52), hr("48")]), 50);
  assert.equal(preSleepBpm([hr("50"), hr(52)]), null);
  assert.deepEqual(preSleepWindow("2026-10-15T06:00:00Z"), { from: "2026-10-15T05:30:00.000Z", to: "2026-10-15T06:00:00.000Z" });
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

test("nights uses the main sleep only (naps excluded), counts a duplicate session once, and wraps after-midnight bedtimes", () => {
  const main = session("2026-10-02", 30, 7 * 60, 400);
  const dup = { ...main, minutesAsleep: 390, mainSleep: false }; // same night from another source
  const nap = session("2026-10-02", 14 * 60, 14 * 60 + 40, 20, { mainSleep: false, nap: true });
  const napOnly = session("2026-10-03", 14 * 60, 14 * 60 + 40, 20, { mainSleep: false, nap: true });
  assert.deepEqual(nights([main, dup, nap, napOnly]), [
    {
      date: "2026-10-02",
      asleep: 400,
      bed: 1470,
      wake: 420,
      inBed: 420,
      efficiency: 400 / 420,
      deep: null,
      rem: null,
      light: null,
      waso: null,
      awakenings: null,
    },
  ]);
});

test("monthly averages, SDs, consistency and the MIN_DAYS threshold", () => {
  const sessions = [];
  const daily = [];
  for (let d = 1; d <= MIN_DAYS; d++) {
    const date = `2026-10-${String(d).padStart(2, "0")}`;
    // Bedtimes alternate 23:00 / 00:00, wake times 6:00 / 7:00.
    const even = d % 2 === 0;
    sessions.push(session(date, even ? 0 : 23 * 60, even ? 7 * 60 : 6 * 60, even ? 450 : 390));
    daily.push({
      ...EMPTY_DAY,
      date,
      restingHr: 50 + (even ? 2 : 0),
      hrvMs: d === 1 ? 40 : null,
      spo2Pct: even ? 96 : 92,
      vo2Max: d === 1 ? 52 : null,
    });
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
  assert.equal(oct.spo2, 94);
  assert.equal(oct.spo2Min, 92);
  assert.equal(oct.vo2Max, 52); // a single estimate is enough for VO2 max
  assert.equal(oct.respRate, null);
});

test("time in bed and efficiency use every night; stage metrics need MIN_DAYS stage-scored nights", () => {
  const stages = { deepMinutes: 60, remMinutes: 90, lightMinutes: 250, wasoMinutes: 20, awakenings: 2 };
  const sessions = Array.from({ length: MIN_DAYS }, (_, i) =>
    // 400 asleep of 420 in bed; the first night has no stages (a CLASSIC night).
    session(`2026-10-${String(i + 1).padStart(2, "0")}`, 23 * 60, 6 * 60, 400, i === 0 ? {} : stages),
  );
  const [oct] = monthly(sessions, [], "2026-11");
  assert.equal(oct.timeInBed, 420);
  assert.equal(oct.efficiency, 95.2);
  assert.equal(oct.stageNights, MIN_DAYS - 1);
  assert.deepEqual([oct.deep, oct.rem, oct.light, oct.waso, oct.awakenings], [null, null, null, null, null]);
  sessions[0] = { ...sessions[0], ...stages, deepMinutes: 80, awakenings: 3 };
  const [full] = monthly(sessions, [], "2026-11");
  assert.deepEqual([full.deep, full.rem, full.light, full.waso, full.awakenings], [62, 90, 250, 20, 2.1]);
  assert.match(BIOMARKERS.find((b) => b.key === "deep")!.note(full), /\(15% of sleep stages\) over 10 nights/);
});

test("every biomarker note renders from a month's values", () => {
  const sessions = Array.from({ length: MIN_DAYS }, (_, i) =>
    session(`2026-10-${String(i + 1).padStart(2, "0")}`, 23 * 60, 6 * 60, 400, {
      deepMinutes: 60,
      remMinutes: 90,
      lightMinutes: 250,
      wasoMinutes: 20,
      awakenings: 2,
    }),
  );
  const daily = sessions.map((s) => ({
    date: s.wakeDate,
    restingHr: 50,
    hrvMs: 45,
    spo2Pct: 95,
    respRate: 14,
    skinTempDeltaC: 0.3,
    preSleepHr: 51,
    vo2Max: 52,
  }));
  const [oct] = monthly(sessions, daily, "2026-11");
  for (const b of BIOMARKERS) {
    assert.notEqual(oct[b.key], null, b.name);
    assert.match(b.note(oct), /Google Health/);
  }
  assert.match(BIOMARKERS.find((b) => b.key === "bedtime")!.note(oct), /11:00 PM/);
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
