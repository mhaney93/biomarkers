// Sleep (timing, time in bed, efficiency, stages, awake time), heart rate, HRV, SpO2, respiratory rate, skin temperature and VO2 max from the Google Health API, turned into monthly biomarker
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
// The in-progress month is published as a month-to-date average from this many days.
export const PARTIAL_MIN_DAYS = 3;
// Bump when the set of Google Health data types the sync reads changes: the next sync then rescans
// all history once so the new metrics are backfilled.
export const SYNC_VERSION = 3;
export const PARTIAL_NOTE = "Month to date";

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
    // CLASSIC sessions have AWAKE / RESTLESS / ASLEEP stages; STAGES sessions AWAKE / LIGHT / DEEP / REM.
    type?: string;
    // Contiguous, non-overlapping segments covering the whole session.
    stages?: SleepStage[];
    metadata?: { mainSleep?: boolean; nap?: boolean } & Record<string, unknown>;
    summary?: {
      minutesAsleep?: string | number;
      minutesInSleepPeriod?: string | number;
      minutesAwake?: string | number;
      minutesToFallAsleep?: string | number;
      stagesSummary?: { type?: string; minutes?: string | number; count?: string | number }[];
    } & Record<string, unknown>;
  } & Record<string, unknown>;
};

export type SleepStage = { type?: string; startTime?: string; endTime?: string } & Record<string, unknown>;

export type DailyRestingHeartRatePoint = {
  dailyRestingHeartRate?: { date?: CivilDate; beatsPerMinute?: string | number };
};
export type DailyHrvPoint = {
  dailyHeartRateVariability?: { date?: CivilDate; averageHeartRateVariabilityMilliseconds?: number | string };
};

export type DailySpo2Point = {
  dailyOxygenSaturation?: { date?: CivilDate; averagePercentage?: number | string };
};
export type DailyRespiratoryRatePoint = {
  dailyRespiratoryRate?: { date?: CivilDate; breathsPerMinute?: number | string };
};
export type DailySkinTempPoint = {
  dailySleepTemperatureDerivations?: {
    date?: CivilDate;
    nightlyTemperatureCelsius?: number | string;
    baselineTemperatureCelsius?: number | string;
  };
};
export type DailyVo2MaxPoint = { dailyVo2Max?: { date?: CivilDate; vo2Max?: number | string } };
export type HeartRatePoint = {
  heartRate?: { beatsPerMinute?: string | number; sampleTime?: { physicalTime?: string } };
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
  // CLASSIC or STAGES. The stage fields below are null unless the session is STAGES-scored.
  sleepType: string | null;
  deepMinutes: number | null;
  remMinutes: number | null;
  lightMinutes: number | null;
  // Awake after sleep onset: AWAKE segments between the first and last sleep segment, and how many
  // of them lasted at least AWAKENING_MINUTES. Null without a stage list.
  wasoMinutes: number | null;
  awakenings: number | null;
  // Google's own minutesToFallAsleep, kept as reported (not published; see the PR that added it).
  minutesToFallAsleep: number | null;
};

// An awakening counts when it lasts at least this long (the NSF sleep-quality indicators count
// awakenings of more than 5 minutes).
export const AWAKENING_MINUTES = 5;

export type DailyHealth = {
  date: string;
  restingHr: number | null;
  hrvMs: number | null;
  spo2Pct: number | null;
  respRate: number | null;
  skinTempDeltaC: number | null;
  preSleepHr: number | null;
  vo2Max: number | null;
};

export type DailyExtra = {
  spo2?: DailySpo2Point[];
  respiratoryRate?: DailyRespiratoryRatePoint[];
  skinTemp?: DailySkinTempPoint[];
  vo2Max?: DailyVo2MaxPoint[];
  preSleep?: { date: string; bpm: number }[];
};

// Heart rate before sleep: the mean of the samples in the PRE_SLEEP_MINUTES before a session starts,
// kept for the PRE_SLEEP_DAYS most recent nights (one heart-rate request per night).
export const PRE_SLEEP_MINUTES = 30;
export const PRE_SLEEP_DAYS = 60;
const MIN_PRE_SLEEP_SAMPLES = 3;

export function preSleepWindow(startIso: string) {
  const start = Date.parse(startIso);
  return { from: new Date(start - PRE_SLEEP_MINUTES * 60e3).toISOString(), to: new Date(start).toISOString() };
}

export function preSleepBpm(points: HeartRatePoint[]): number | null {
  const bpm = points.map((p) => Number(p.heartRate?.beatsPerMinute)).filter((v) => Number.isFinite(v) && v > 0);
  return bpm.length >= MIN_PRE_SLEEP_SAMPLES ? round(mean(bpm), 1) : null;
}

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

const segMinutes = (x: SleepStage) => (Date.parse(x.endTime ?? "") - Date.parse(x.startTime ?? "")) / 60e3;

// Deep / REM / light minutes from the stages summary (or the segments when there is no summary),
// for a STAGES-scored session only.
function stageMinutes(s: SleepDataPoint["sleep"]) {
  const none = { deepMinutes: null, remMinutes: null, lightMinutes: null };
  if (s.type !== "STAGES") return none;
  const summary = s.summary?.stagesSummary ?? [];
  const segments = (s.stages ?? []).filter((x) => Number.isFinite(segMinutes(x)));
  if (!summary.length && !segments.length) return none;
  const of = (type: string) =>
    summary.length
      ? (int(summary.find((x) => x.type === type)?.minutes) ?? 0)
      : Math.round(segments.filter((x) => x.type === type).reduce((a, x) => a + segMinutes(x), 0));
  return { deepMinutes: of("DEEP"), remMinutes: of("REM"), lightMinutes: of("LIGHT") };
}

// Awake time after sleep onset and awakenings (>= AWAKENING_MINUTES), from a STAGES session's segments.
function wakeAfterOnset(s: SleepDataPoint["sleep"]) {
  const segs = (s.stages ?? [])
    .filter((x) => Number.isFinite(segMinutes(x)))
    .sort((a, b) => Date.parse(a.startTime!) - Date.parse(b.startTime!));
  if (s.type !== "STAGES" || !segs.length) return { wasoMinutes: null, awakenings: null };
  const asleep = segs.map((x) => x.type !== "AWAKE");
  const first = asleep.indexOf(true);
  const last = asleep.lastIndexOf(true);
  const awake = first < 0 ? [] : segs.slice(first, last + 1).filter((x) => x.type === "AWAKE");
  return {
    wasoMinutes: Math.round(awake.reduce((a, x) => a + segMinutes(x), 0)),
    awakenings: awake.filter((x) => segMinutes(x) >= AWAKENING_MINUTES).length,
  };
}

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
    sleepType: s.type ?? null,
    ...stageMinutes(s),
    ...wakeAfterOnset(s),
    minutesToFallAsleep: int(s.summary?.minutesToFallAsleep),
  };
}

// Daily points -> one row per date. Skin temperature is the night's reading minus the baseline.
export function mapDaily(
  resting: DailyRestingHeartRatePoint[] = [],
  hrv: DailyHrvPoint[] = [],
  extra: DailyExtra = {},
): DailyHealth[] {
  const days = new Map<string, DailyHealth>();
  const at = (date: string) => {
    let d = days.get(date);
    if (!d)
      days.set(
        date,
        (d = { date, restingHr: null, hrvMs: null, spo2Pct: null, respRate: null, skinTempDeltaC: null, preSleepHr: null, vo2Max: null }),
      );
    return d;
  };
  const num = (v: number | string | null | undefined) => (v == null || v === "" || !Number.isFinite(Number(v)) ? null : Number(v));
  for (const p of resting) {
    const d = p.dailyRestingHeartRate;
    if (d?.date && d.beatsPerMinute != null) at(civilDate(d.date)).restingHr = Number(d.beatsPerMinute);
  }
  for (const p of hrv) {
    const d = p.dailyHeartRateVariability;
    if (d?.date && d.averageHeartRateVariabilityMilliseconds != null)
      at(civilDate(d.date)).hrvMs = Number(d.averageHeartRateVariabilityMilliseconds);
  }
  for (const p of extra.spo2 ?? []) {
    const d = p.dailyOxygenSaturation;
    const v = num(d?.averagePercentage);
    if (d?.date && v != null) at(civilDate(d.date)).spo2Pct = v;
  }
  for (const p of extra.respiratoryRate ?? []) {
    const d = p.dailyRespiratoryRate;
    const v = num(d?.breathsPerMinute);
    if (d?.date && v != null) at(civilDate(d.date)).respRate = v;
  }
  for (const p of extra.skinTemp ?? []) {
    const d = p.dailySleepTemperatureDerivations;
    const night = num(d?.nightlyTemperatureCelsius);
    const base = num(d?.baselineTemperatureCelsius);
    if (d?.date && night != null && base != null) at(civilDate(d.date)).skinTempDeltaC = round(night - base, 2);
  }
  for (const p of extra.vo2Max ?? []) {
    const d = p.dailyVo2Max;
    const v = num(d?.vo2Max);
    if (d?.date && v != null) at(civilDate(d.date)).vo2Max = v;
  }
  for (const p of extra.preSleep ?? []) at(p.date).preSleepHr = p.bpm;
  return [...days.values()];
}

type NightInput = Pick<
  SleepSession,
  "wakeDate" | "startTime" | "endTime" | "bedMinute" | "wakeMinute" | "minutesAsleep" | "mainSleep" | "nap"
> &
  Partial<Pick<SleepSession, "deepMinutes" | "remMinutes" | "lightMinutes" | "wasoMinutes" | "awakenings">>;
export type Night = {
  date: string;
  asleep: number;
  bed: number;
  wake: number;
  // Minutes from the start to the end of the session, and minutes asleep / that (null without minutes asleep).
  inBed: number;
  efficiency: number | null;
  // Null unless the night is STAGES-scored.
  deep: number | null;
  rem: number | null;
  light: number | null;
  waso: number | null;
  awakenings: number | null;
};

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
    const inBed = Math.round((Date.parse(main.endTime) - Date.parse(main.startTime)) / 60e3);
    out.push({
      date,
      asleep: main.minutesAsleep ?? 0,
      bed: main.bedMinute < 12 * 60 ? main.bedMinute + 24 * 60 : main.bedMinute,
      wake: main.wakeMinute,
      inBed,
      efficiency: main.minutesAsleep != null && inBed > 0 ? main.minutesAsleep / inBed : null,
      deep: main.deepMinutes ?? null,
      rem: main.remMinutes ?? null,
      light: main.lightMinutes ?? null,
      waso: main.wasoMinutes ?? null,
      awakenings: main.awakenings ?? null,
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
  // The in-progress month: averages so far, through the latest date with data.
  partial: boolean;
  nights: number;
  rhrDays: number;
  hrvDays: number;
  spo2Days: number;
  spo2Min: number | null;
  respDays: number;
  skinTempDays: number;
  preSleepDays: number;
  vo2Days: number;
  // Nights with deep / REM / light stages, and nights with a stage list (awake time, awakenings).
  stageNights: number;
  wasoNights: number;
  bedSd: number | null;
  wakeSd: number | null;
  bedtimeMin: number | null;
  wakeMin: number | null;
  duration: number | null;
  timeInBed: number | null;
  efficiency: number | null;
  deep: number | null;
  rem: number | null;
  light: number | null;
  waso: number | null;
  awakenings: number | null;
  consistency: number | null;
  bedtime: number | null;
  wake: number | null;
  restingHr: number | null;
  hrv: number | null;
  spo2: number | null;
  respRate: number | null;
  skinTemp: number | null;
  preSleepHr: number | null;
  vo2Max: number | null;
};

export type MetricKey =
  | "duration"
  | "timeInBed"
  | "efficiency"
  | "deep"
  | "rem"
  | "light"
  | "waso"
  | "awakenings"
  | "consistency"
  | "bedtime"
  | "wake"
  | "restingHr"
  | "hrv"
  | "spo2"
  | "respRate"
  | "skinTemp"
  | "preSleepHr"
  | "vo2Max";

// Daily metrics averaged per month: the DailyHealth column and how many days a month needs.
// VO2 max is re-estimated only now and then, so one day is enough.
const DAILY_METRICS = {
  restingHr: { column: "restingHr", minDays: MIN_DAYS, places: 1 },
  hrv: { column: "hrvMs", minDays: MIN_DAYS, places: 1 },
  spo2: { column: "spo2Pct", minDays: MIN_DAYS, places: 1 },
  respRate: { column: "respRate", minDays: MIN_DAYS, places: 1 },
  skinTemp: { column: "skinTempDeltaC", minDays: MIN_DAYS, places: 2 },
  preSleepHr: { column: "preSleepHr", minDays: MIN_DAYS, places: 1 },
  vo2Max: { column: "vo2Max", minDays: 1, places: 1 },
} as const;

// Monthly values for each calendar month (by wake date / day) before `beforeMonth` (YYYY-MM).
// A value is null when the month has fewer than its minimum days of data.
// `partialMonth` (YYYY-MM) is also included, as a month-to-date average needing fewer days.
export function monthly(
  sessions: NightInput[],
  daily: DailyHealth[],
  beforeMonth: string,
  partialMonth?: string,
): MonthValues[] {
  type Acc = { nights: Night[]; daily: Record<keyof typeof DAILY_METRICS, number[]>; last: string };
  const months = new Map<string, Acc>();
  const at = (month: string) => {
    let m = months.get(month);
    if (!m)
      months.set(
        month,
        (m = { nights: [], daily: { restingHr: [], hrv: [], spo2: [], respRate: [], skinTemp: [], preSleepHr: [], vo2Max: [] }, last: "" }),
      );
    return m;
  };
  const wanted = (month: string) => month < beforeMonth || month === partialMonth;
  const seen = (m: Acc, date: string) => {
    if (date > m.last) m.last = date;
  };
  for (const n of nights(sessions)) {
    const month = n.date.slice(0, 7);
    if (!wanted(month)) continue;
    at(month).nights.push(n);
    seen(at(month), n.date);
  }
  for (const d of daily) {
    const month = d.date.slice(0, 7);
    if (!wanted(month)) continue;
    for (const [key, { column }] of Object.entries(DAILY_METRICS) as [keyof typeof DAILY_METRICS, (typeof DAILY_METRICS)[keyof typeof DAILY_METRICS]][]) {
      const v = d[column];
      if (v != null) {
        at(month).daily[key].push(v);
        seen(at(month), d.date);
      }
    }
  }
  return [...months]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { nights: ns, daily: dm, last }]) => {
      const partial = month === partialMonth;
      const need = partial ? PARTIAL_MIN_DAYS : MIN_DAYS;
      const sleep = ns.length >= need;
      // Mean of a per-night value over the nights that have it, when enough do.
      const per = (f: (n: Night) => number | null, places = 0, scale = 1) => {
        const xs = ns.map(f).filter((v): v is number => v != null);
        return xs.length >= need ? round(mean(xs) * scale, places) : null;
      };
      const bedSd = sleep ? sd(ns.map((n) => n.bed)) : null;
      const wakeSd = sleep ? sd(ns.map((n) => n.wake)) : null;
      const bedtimeMin = sleep ? mean(ns.map((n) => n.bed)) : null;
      const wakeMin = sleep ? mean(ns.map((n) => n.wake)) : null;
      const avg = (k: keyof typeof DAILY_METRICS) =>
        dm[k].length >= (partial ? Math.min(PARTIAL_MIN_DAYS, DAILY_METRICS[k].minDays) : DAILY_METRICS[k].minDays) && dm[k].length > 0 ? round(mean(dm[k]), DAILY_METRICS[k].places) : null;
      return {
        month,
        date: partial && last ? last : lastDayOfMonth(month),
        partial,
        nights: ns.length,
        rhrDays: dm.restingHr.length,
        hrvDays: dm.hrv.length,
        spo2Days: dm.spo2.length,
        spo2Min: dm.spo2.length ? Math.min(...dm.spo2) : null,
        respDays: dm.respRate.length,
        skinTempDays: dm.skinTemp.length,
        preSleepDays: dm.preSleepHr.length,
        vo2Days: dm.vo2Max.length,
        stageNights: ns.filter((n) => n.deep != null).length,
        wasoNights: ns.filter((n) => n.waso != null).length,
        bedSd: bedSd == null ? null : round(bedSd),
        wakeSd: wakeSd == null ? null : round(wakeSd),
        bedtimeMin,
        wakeMin,
        duration: sleep ? round(mean(ns.map((n) => n.asleep))) : null,
        timeInBed: sleep ? round(mean(ns.map((n) => n.inBed))) : null,
        efficiency: per((n) => n.efficiency, 1, 100),
        deep: per((n) => n.deep),
        rem: per((n) => n.rem),
        light: per((n) => n.light),
        waso: per((n) => n.waso),
        awakenings: per((n) => n.awakenings, 1),
        consistency: bedSd == null || wakeSd == null ? null : round(Math.sqrt((bedSd ** 2 + wakeSd ** 2) / 2)),
        bedtime: bedtimeMin == null ? null : round(bedtimeMin / 60, 2),
        wake: wakeMin == null ? null : round(wakeMin / 60, 2),
        restingHr: avg("restingHr"),
        hrv: avg("hrv"),
        spo2: avg("spo2"),
        respRate: avg("respRate"),
        skinTemp: avg("skinTemp"),
        preSleepHr: avg("preSleepHr"),
        vo2Max: avg("vo2Max"),
      };
    });
}

// A stage's share of deep + REM + light, as a whole percent.
const stageShare = (m: MonthValues, v: number | null) => {
  const total = (m.deep ?? 0) + (m.rem ?? 0) + (m.light ?? 0);
  return v == null || !total ? 0 : round((v / total) * 100);
};

// A reading's note: the biomarker's own, prefixed for a month still in progress.
export const readingNote = (b: SleepBiomarker, m: MonthValues) =>
  m.partial ? `${PARTIAL_NOTE} (through ${m.date}; final value is written when the month ends). ${b.note(m)}` : b.note(m);

export type SleepBiomarker = {
  key: MetricKey;
  name: string;
  unit: string | null;
  valueType: "duration" | "number";
  // Reference range (best-guess for a healthy adult male; sources in the comments on each entry).
  refLow?: string;
  refHigh?: string;
  note: (m: MonthValues) => string;
};

// The biomarkers the sync writes, all in CATEGORY. The first is the hand-entered one; it already
// exists and is left as it is (name, type and the owner's range). Every other one carries a
// researched best-guess range (adult male, 33) so none reads "No range set"; the same numbers are
// applied to existing rows by scripts/set-reference-ranges.mjs.
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
    key: "timeInBed",
    name: "Time in Bed (Monthly)",
    unit: null,
    valueType: "duration",
    refLow: "450",
    refHigh: "570", // 7h30m-9h30m: 7-9 h asleep (AASM/NSF) at the 85%+ efficiency of a healthy sleeper; much longer in bed lowers efficiency
    note: (m) =>
      `Mean time from the start to the end of the main sleep (asleep and awake) over ${m.nights} nights. Google Health.`,
  },
  {
    key: "efficiency",
    name: "Sleep Efficiency (Monthly)",
    unit: "%",
    valueType: "number",
    refLow: "85", // AASM/NSF: 85% or more of time in bed asleep is normal for adults
    note: (m) =>
      `Mean share of time in bed spent asleep (minutes asleep / time in bed) over ${m.nights} nights' main sleep. Google Health.`,
  },
  {
    key: "deep",
    name: "Deep Sleep (Monthly)",
    unit: null,
    valueType: "duration",
    refLow: "55", // deep (N3) sleep is about 13-23% of sleep in healthy adults; 13% of 7 h is about 55 min
    note: (m) =>
      `Mean minutes of deep sleep per night (${stageShare(m, m.deep)}% of sleep stages) over ${m.stageNights} nights with sleep stages. Wrist estimate, not a sleep-lab study. Google Health.`,
  },
  {
    key: "rem",
    name: "REM Sleep (Monthly)",
    unit: null,
    valueType: "duration",
    refLow: "85", // REM is about 20-25% of sleep in healthy adults; 20% of 7 h is about 85 min
    note: (m) =>
      `Mean minutes of REM sleep per night (${stageShare(m, m.rem)}% of sleep stages) over ${m.stageNights} nights with sleep stages. Wrist estimate, not a sleep-lab study. Google Health.`,
  },
  {
    key: "light",
    name: "Light Sleep (Monthly)",
    unit: null,
    valueType: "duration",
    refLow: "180",
    refHigh: "300", // light (N1 + N2) sleep is about 45-60% of sleep; roughly 3-5 h of a 7-8 h night
    note: (m) =>
      `Mean minutes of light sleep per night (${stageShare(m, m.light)}% of sleep stages) over ${m.stageNights} nights with sleep stages. Wrist estimate, not a sleep-lab study. Google Health.`,
  },
  {
    key: "waso",
    name: "Awake Time After Falling Asleep (Monthly)",
    unit: null,
    valueType: "duration",
    refHigh: "50", // NSF sleep-quality indicators: 51+ min awake after sleep onset is poor for adults (20 min or less is good)
    note: (m) =>
      `Mean minutes awake between first falling asleep and the final wake-up (WASO) over ${m.wasoNights} nights with sleep stages. Very brief wake-ups that Google does not score as an awake stage are not counted. Google Health.`,
  },
  {
    key: "awakenings",
    name: "Awakenings (Monthly)",
    unit: "per night",
    valueType: "number",
    refHigh: "3", // NSF sleep-quality indicators: 4 or more awakenings over 5 min a night is poor for adults (1 or fewer is good)
    note: (m) =>
      `Mean number of times awake for ${AWAKENING_MINUTES} minutes or more after first falling asleep, over ${m.wasoNights} nights with sleep stages. Google Health.`,
  },
  {
    key: "consistency",
    name: "Sleep Consistency (Monthly)",
    unit: "min SD",
    valueType: "number",
    refHigh: "60", // Blueprint/sleep-regularity research: bed and wake times within about 30-60 min SD
    note: (m) =>
      `Root mean square of the standard deviations of bedtime (${m.bedSd} min) and wake time (${m.wakeSd} min) over ${m.nights} nights' main sleep; lower is steadier. Google Health.`,
  },
  {
    key: "bedtime",
    name: "Average Bedtime (Monthly)",
    unit: "h (24 = midnight)",
    valueType: "number",
    refHigh: "24", // asleep by midnight; Blueprint lights out around 8:30-9 PM, standard advice 10 PM-midnight
    note: (m) =>
      `Mean main-sleep start ${clock(m.bedtimeMin!)} over ${m.nights} nights. Clock hours, counting past 24 after midnight (24.5 = 12:30 AM). Google Health.`,
  },
  {
    key: "wake",
    name: "Average Wake Time (Monthly)",
    unit: "h (6.5 = 6:30 AM)",
    valueType: "number",
    refHigh: "8", // up by about 8 AM; standard adult schedule 5:30-8 AM
    note: (m) => `Mean main-sleep end ${clock(m.wakeMin!)} over ${m.nights} nights. Clock hours after midnight. Google Health.`,
  },
  {
    key: "restingHr",
    name: "Resting Heart Rate (Monthly)",
    unit: "bpm",
    valueType: "number",
    refLow: "40",
    refHigh: "70", // endurance-trained adults run 40-60; AHA 60-100 would flag a runner, so the top is tightened
    note: (m) => `Mean of ${m.rhrDays} daily resting heart rates. Google Health.`,
  },
  {
    key: "hrv",
    name: "Heart Rate Variability (Monthly)",
    unit: "ms",
    valueType: "number",
    refLow: "40", // sleeping RMSSD for men in their 30s averages about 40-60 ms; higher is better
    note: (m) => `Mean of ${m.hrvDays} nightly HRV values (RMSSD during sleep). Google Health.`,
  },
  {
    key: "preSleepHr",
    name: "Heart Rate Before Sleep (Monthly)",
    unit: "bpm",
    valueType: "number",
    refHigh: "50",
    note: (m) =>
      `Mean over ${m.preSleepDays} nights of the average heart rate in the ${PRE_SLEEP_MINUTES} minutes before the main sleep started. Blueprint target: about 50 bpm or lower. Google Health.`,
  },
  {
    key: "spo2",
    name: "Overnight SpO2 (Monthly)",
    unit: "%",
    valueType: "number",
    refLow: "95", // normal blood oxygen saturation is 95-100%
    note: (m) =>
      `Mean of ${m.spo2Days} nightly average blood oxygen saturations; lowest night ${m.spo2Min}%. Google Health.`,
  },
  {
    key: "respRate",
    name: "Sleep Respiratory Rate (Monthly)",
    unit: "breaths/min",
    valueType: "number",
    refLow: "12",
    refHigh: "20", // normal adult respiratory rate is 12-20 breaths/min
    note: (m) => `Mean of ${m.respDays} nightly average breathing rates during sleep. Google Health.`,
  },
  {
    key: "skinTemp",
    name: "Overnight Skin Temperature Variation (Monthly)",
    unit: "°C vs baseline",
    valueType: "number",
    refLow: "-1",
    refHigh: "1", // nightly deviations within about +/-1 C (+/-1.8 F) of the wearer's baseline are normal
    note: (m) =>
      `Mean of ${m.skinTempDays} nights of sleeping skin temperature minus the wearer's own baseline (positive is warmer). Google Health.`,
  },
  {
    key: "vo2Max",
    name: "VO2 Max (Fitbit estimate) (Monthly)",
    unit: "mL/kg/min",
    valueType: "number",
    refLow: "40", // Cooper/ACSM: "good" or better for men 30-39 is about 40 mL/kg/min and up
    note: (m) =>
      `Mean of ${m.vo2Days} daily Fitbit cardio fitness estimates from the wrist sensor, not a lab VO2 max test. Google Health.`,
  },
];

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
