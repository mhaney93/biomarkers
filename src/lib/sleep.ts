// Sleep, resting heart rate and HRV from the Google Health API, turned into monthly biomarker
// values for the "Sleep" category. Pure functions only (no DB, no network), so they can be
// tested with `npm test`. The DB side is in sleep-sync.ts.

export const CATEGORY = "Sleep";
export const TIME_ZONE = "America/Los_Angeles";
// Where the first scan starts; each window reads up to a year from the cursor.
export const SLEEP_EPOCH = "2010-01-01";
export const WINDOW_DAYS = 366;
// Re-read recent nights on every sync: late watch syncs and Google's re-scoring.
export const OVERLAP_DAYS = 3;
// A month with fewer days of a metric than this is not published for that metric.
export const MIN_DAYS = 10;
// Sleep duration publishing is held while computed durations differ from the hand-entered months by more than
// this (median absolute difference, minutes), so a definitional gap is reported, not written.
export const MAX_MEDIAN_DIFF = 10;

const DAY = 86400e3;
const pad = (n: number) => String(n).padStart(2, "0");

export const addDays = (date: string, n: number) =>
  new Date(Date.parse(date) + n * DAY).toISOString().slice(0, 10);

// Today's date (YYYY-MM-DD) in Pacific time.
export const pacificToday = (now = new Date()) => now.toLocaleDateString("en-CA", { timeZone: TIME_ZONE });

export function lastDayOfMonth(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
}

// "11:32 PM" from minutes after midnight (wrapping past 24 h).
export function clock(minutes: number) {
  const m = Math.round(minutes) % 1440;
  const h = Math.floor(m / 60);
  return `${h % 12 || 12}:${pad(m % 60)} ${h < 12 ? "AM" : "PM"}`;
}

// ---- Google Health API shapes (v4 discovery document; int64 fields arrive as strings) ----

type CivilDate = { year: number; month: number; day: number };
type CivilDateTime = { date?: CivilDate; time?: { hours?: number; minutes?: number; seconds?: number } };

export type SleepDataPoint = {
  name: string;
  dataSource?: { platform?: string; device?: { displayName?: string } } & Record<string, unknown>;
  sleep: {
    interval: {
      startTime: string;
      endTime: string;
      startUtcOffset?: string;
      endUtcOffset?: string;
      civilStartTime?: CivilDateTime;
      civilEndTime?: CivilDateTime;
    };
    type?: string;
    metadata?: { mainSleep?: boolean; nap?: boolean } & Record<string, unknown>;
    summary?: { minutesAsleep?: string | number; minutesInSleepPeriod?: string | number } & Record<string, unknown>;
  } & Record<string, unknown>;
};

export type DailyRestingHeartRatePoint = {
  dailyRestingHeartRate?: { date?: CivilDate; beatsPerMinute?: string | number };
};
export type DailyHrvPoint = {
  dailyHeartRateVariability?: { date?: CivilDate; averageHeartRateVariabilityMilliseconds?: number | string };
};

export type SleepSession = {
  sleepId: string;
  wakeDate: string;
  startTime: string;
  endTime: string;
  bedMinute: number;
  wakeMinute: number;
  minutesAsleep: number | null;
  mainSleep: boolean | null;
  nap: boolean;
};

export type DailyHealth = { date: string; restingHr: number | null; hrvMs: number | null };

export const civilDate = (d: CivilDate) => `${d.year}-${pad(d.month)}-${pad(d.day)}`;

function durationSecs(d: string | undefined) {
  if (typeof d !== "string" || !d.endsWith("s")) return 0;
  const n = parseFloat(d);
  return Number.isFinite(n) ? n : 0;
}

// Local date and minutes after local midnight: the API's civil time when it sends one, else the
// instant shifted by its UTC offset.
function civilClock(civil: CivilDateTime | undefined, iso: string, offset: string | undefined) {
  if (civil?.date) {
    const t = civil.time ?? {};
    return { date: civilDate(civil.date), minutes: (t.hours ?? 0) * 60 + (t.minutes ?? 0) + (t.seconds ?? 0) / 60 };
  }
  const local = new Date(Date.parse(iso) + durationSecs(offset) * 1000);
  return {
    date: local.toISOString().slice(0, 10),
    minutes: local.getUTCHours() * 60 + local.getUTCMinutes() + local.getUTCSeconds() / 60,
  };
}

const int = (v: string | number | null | undefined) => (v == null || v === "" ? null : Number(v));

// One `sleep` data point -> a sleep_sessions row. A night belongs to the local date it ends on.
export function mapSleep(dp: SleepDataPoint): SleepSession {
  const s = dp.sleep;
  const iv = s.interval;
  const start = civilClock(iv.civilStartTime, iv.startTime, iv.startUtcOffset);
  const end = civilClock(iv.civilEndTime, iv.endTime, iv.endUtcOffset);
  return {
    sleepId: dp.name.split("/").pop()!,
    wakeDate: end.date,
    startTime: iv.startTime,
    endTime: iv.endTime,
    bedMinute: Math.round(start.minutes),
    wakeMinute: Math.round(end.minutes),
    minutesAsleep: int(s.summary?.minutesAsleep),
    mainSleep: s.metadata?.mainSleep ?? null,
    nap: s.metadata?.nap ?? false,
  };
}

// Daily RHR / HRV points -> one row per date.
export function mapDaily(resting: DailyRestingHeartRatePoint[] = [], hrv: DailyHrvPoint[] = []): DailyHealth[] {
  const days = new Map<string, DailyHealth>();
  const at = (date: string) => {
    let d = days.get(date);
    if (!d) days.set(date, (d = { date, restingHr: null, hrvMs: null }));
    return d;
  };
  for (const p of resting) {
    const d = p.dailyRestingHeartRate;
    if (d?.date && d.beatsPerMinute != null) at(civilDate(d.date)).restingHr = Number(d.beatsPerMinute);
  }
  for (const p of hrv) {
    const d = p.dailyHeartRateVariability;
    if (d?.date && d.averageHeartRateVariabilityMilliseconds != null)
      at(civilDate(d.date)).hrvMs = Number(d.averageHeartRateVariabilityMilliseconds);
  }
  return [...days.values()];
}

type NightInput = Pick<
  SleepSession,
  "wakeDate" | "startTime" | "endTime" | "bedMinute" | "wakeMinute" | "minutesAsleep" | "mainSleep" | "nap"
>;
export type Night = { date: string; asleep: number; bed: number; wake: number };

const overlaps = (a: NightInput, b: NightInput) =>
  Date.parse(a.startTime) < Date.parse(b.endTime) && Date.parse(b.startTime) < Date.parse(a.endTime);

// One entry per wake date from its main sleep: minutes asleep, bedtime and wake time. Naps are
// excluded (the owner's choice: it tracks his hand-entered months best), and the same night recorded
// by two sources counts once. Bedtime minutes run past 24 h for bedtimes before noon (00:30 is 1470, after 23:30's 1410).
export function nights(sessions: NightInput[]): Night[] {
  const byDate = new Map<string, NightInput[]>();
  for (const s of sessions) byDate.set(s.wakeDate, [...(byDate.get(s.wakeDate) ?? []), s]);
  const out: Night[] = [];
  for (const [date, list] of [...byDate].sort(([a], [b]) => a.localeCompare(b))) {
    const longest = [...list].sort((a, b) => (b.minutesAsleep ?? 0) - (a.minutesAsleep ?? 0));
    const kept: NightInput[] = [];
    for (const s of longest) if (!kept.some((k) => overlaps(k, s))) kept.push(s);
    const main = kept.find((s) => s.mainSleep) ?? kept.find((s) => !s.nap) ?? kept[0];
    if (main.nap) continue; // naps only: says nothing about bed and wake times
    out.push({
      date,
      asleep: main.minutesAsleep ?? 0,
      bed: main.bedMinute < 12 * 60 ? main.bedMinute + 24 * 60 : main.bedMinute,
      wake: main.wakeMinute,
    });
  }
  return out;
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const sd = (xs: number[]) => {
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
};
const round = (v: number, places = 0) => Math.round(v * 10 ** places) / 10 ** places;

export type MonthValues = {
  month: string;
  date: string;
  nights: number;
  rhrDays: number;
  hrvDays: number;
  bedSd: number | null;
  wakeSd: number | null;
  bedtimeMin: number | null;
  wakeMin: number | null;
  duration: number | null;
  consistency: number | null;
  bedtime: number | null;
  wake: number | null;
  restingHr: number | null;
  hrv: number | null;
};

export type MetricKey = "duration" | "consistency" | "bedtime" | "wake" | "restingHr" | "hrv";

// Monthly values for each calendar month (by wake date / day) before `beforeMonth` (YYYY-MM).
// A value is null when the month has fewer than MIN_DAYS days of its data.
export function monthly(sessions: NightInput[], daily: DailyHealth[], beforeMonth: string): MonthValues[] {
  const months = new Map<string, { nights: Night[]; rhr: number[]; hrv: number[] }>();
  const at = (month: string) => {
    let m = months.get(month);
    if (!m) months.set(month, (m = { nights: [], rhr: [], hrv: [] }));
    return m;
  };
  for (const n of nights(sessions)) if (n.date.slice(0, 7) < beforeMonth) at(n.date.slice(0, 7)).nights.push(n);
  for (const d of daily) {
    const month = d.date.slice(0, 7);
    if (month >= beforeMonth) continue;
    if (d.restingHr != null) at(month).rhr.push(d.restingHr);
    if (d.hrvMs != null) at(month).hrv.push(d.hrvMs);
  }
  return [...months]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { nights: ns, rhr, hrv }]) => {
      const sleep = ns.length >= MIN_DAYS;
      const bedSd = sleep ? sd(ns.map((n) => n.bed)) : null;
      const wakeSd = sleep ? sd(ns.map((n) => n.wake)) : null;
      const bedtimeMin = sleep ? mean(ns.map((n) => n.bed)) : null;
      const wakeMin = sleep ? mean(ns.map((n) => n.wake)) : null;
      return {
        month,
        date: lastDayOfMonth(month),
        nights: ns.length,
        rhrDays: rhr.length,
        hrvDays: hrv.length,
        bedSd: bedSd == null ? null : round(bedSd),
        wakeSd: wakeSd == null ? null : round(wakeSd),
        bedtimeMin,
        wakeMin,
        duration: sleep ? round(mean(ns.map((n) => n.asleep))) : null,
        consistency: bedSd == null || wakeSd == null ? null : round(Math.sqrt((bedSd ** 2 + wakeSd ** 2) / 2)),
        bedtime: bedtimeMin == null ? null : round(bedtimeMin / 60, 2),
        wake: wakeMin == null ? null : round(wakeMin / 60, 2),
        restingHr: rhr.length >= MIN_DAYS ? round(mean(rhr), 1) : null,
        hrv: hrv.length >= MIN_DAYS ? round(mean(hrv), 1) : null,
      };
    });
}

export type SleepBiomarker = {
  key: MetricKey;
  name: string;
  unit: string | null;
  valueType: "duration" | "number";
  note: (m: MonthValues) => string;
};

// The biomarkers the sync writes, all in CATEGORY with no reference range (the standard 60-100 bpm
// would flag a runner's resting HR). The first is the hand-entered one; it already exists and is
// left as it is (name, type and the owner's range).
export const BIOMARKERS: SleepBiomarker[] = [
  {
    key: "duration",
    name: "Average Daily Sleep Duration (Monthly)",
    unit: null,
    valueType: "duration",
    note: (m) =>
      `Mean minutes asleep over ${m.nights} nights' main sleep (naps and awake time excluded). Google Health.`,
  },
  {
    key: "consistency",
    name: "Sleep Consistency (Monthly)",
    unit: "min SD",
    valueType: "number",
    note: (m) =>
      `Root mean square of the standard deviations of bedtime (${m.bedSd} min) and wake time (${m.wakeSd} min) over ${m.nights} nights' main sleep; lower is steadier. Google Health.`,
  },
  {
    key: "bedtime",
    name: "Average Bedtime (Monthly)",
    unit: "h (24 = midnight)",
    valueType: "number",
    note: (m) =>
      `Mean main-sleep start ${clock(m.bedtimeMin!)} over ${m.nights} nights. Clock hours, counting past 24 after midnight (24.5 = 12:30 AM). Google Health.`,
  },
  {
    key: "wake",
    name: "Average Wake Time (Monthly)",
    unit: "h (6.5 = 6:30 AM)",
    valueType: "number",
    note: (m) => `Mean main-sleep end ${clock(m.wakeMin!)} over ${m.nights} nights. Clock hours after midnight. Google Health.`,
  },
  {
    key: "restingHr",
    name: "Resting Heart Rate (Monthly)",
    unit: "bpm",
    valueType: "number",
    note: (m) => `Mean of ${m.rhrDays} daily resting heart rates. Google Health.`,
  },
  {
    key: "hrv",
    name: "Heart Rate Variability (Monthly)",
    unit: "ms",
    valueType: "number",
    note: (m) => `Mean of ${m.hrvDays} nightly HRV values (RMSSD during sleep). Google Health.`,
  },
];

export type DurationComparison = {
  rows: { month: string; site: number; google: number; diff: number }[];
  medianAbsDiff: number | null;
  ok: boolean;
};

// Computed monthly sleep duration against the hand-entered values (YYYY-MM -> minutes) for the
// months both have. `ok` is false when they disagree by more than MAX_MEDIAN_DIFF.
export function compareDurations(months: MonthValues[], siteByMonth: Map<string, number>): DurationComparison {
  const rows = months
    .filter((m) => m.duration != null && siteByMonth.has(m.month))
    .map((m) => ({ month: m.month, site: siteByMonth.get(m.month)!, google: m.duration!, diff: m.duration! - siteByMonth.get(m.month)! }));
  if (!rows.length) return { rows, medianAbsDiff: null, ok: true };
  const abs = rows.map((r) => Math.abs(r.diff)).sort((a, b) => a - b);
  const mid = abs.length >> 1;
  const medianAbsDiff = abs.length % 2 ? abs[mid] : (abs[mid - 1] + abs[mid]) / 2;
  return { rows, medianAbsDiff, ok: medianAbsDiff <= MAX_MEDIAN_DIFF };
}

// The next scan window [from, to) given the cursor (exclusive end of what has been scanned).
// `more` is true while the window stops short of tomorrow (Pacific).
export function nextWindow(cursor: string | null, today: string) {
  const end = addDays(today, 1);
  const from = cursor ? addDays(cursor < end ? cursor : end, -OVERLAP_DAYS) : SLEEP_EPOCH;
  const to = [addDays(from, WINDOW_DAYS), end].sort()[0];
  return { from, to, more: to < end };
}

// Months before this one (YYYY-MM) are complete: Pacific time has moved past them and the scan
// has covered their last day.
export const completeBefore = (cursor: string, today: string) => [today.slice(0, 7), cursor.slice(0, 7)].sort()[0];
