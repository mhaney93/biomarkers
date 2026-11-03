// Nightly ResMed CPAP records from myAir, turned into monthly biomarker values for the "Sleep"
// category. Pure functions only (no DB, no network); the DB side is in myair-sync.ts.
import { addDays, lastDayOfMonth } from "@/lib/sleep";
import type { MyAirSleepRecord } from "@/lib/myair";

// Re-read the last nights on every sync: the machine uploads a night the morning after, sometimes later.
export const CPAP_OVERLAP_DAYS = 3;
// The first sync with nothing stored reads this far back before the month-by-month backfill.
export const CPAP_RECENT_DAYS = 30;
// The backfill walks back a month at a time and stops after this many months in a row with no
// nights (so a gap of up to two years in use is crossed).
export const BACKFILL_EMPTY_MONTHS = 24;
// It never goes before this month.
export const BACKFILL_FLOOR = "2010-01-01";
// A month with fewer nights than this is not published for that metric.
export const MIN_NIGHTS = 10;

export type CpapNight = {
  date: string;
  usageMinutes: number | null;
  ahi: number | null;
  leak: number | null;
  maskPairs: number | null;
  score: number | null;
};

const num = (v: unknown) => {
  if (v == null || v === "" || typeof v === "boolean") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

// One myAir record -> a cpap_nights row; null when it has no usable date.
export function mapRecord(r: MyAirSleepRecord): CpapNight | null {
  const date = typeof r?.startDate === "string" ? r.startDate.slice(0, 10) : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const usage = num(r.totalUsage);
  const whole = (v: unknown) => {
    const n = num(v);
    return n == null ? null : Math.round(n);
  };
  return {
    date,
    usageMinutes: usage == null ? null : Math.max(0, Math.trunc(usage)),
    ahi: num(r.ahi),
    leak: num(r.leakPercentile),
    maskPairs: whole(r.maskPairCount),
    score: whole(r.sleepScore),
  };
}

export const firstOfMonth = (date: string) => `${date.slice(0, 7)}-01`;
export const previousMonth = (monthStart: string) => firstOfMonth(addDays(monthStart, -1));

// [from, to] (inclusive dates) split at month boundaries, oldest first.
export function monthWindows(from: string, to: string) {
  const out: { from: string; to: string }[] = [];
  for (let start = from; start <= to; start = addDays(lastDayOfMonth(start.slice(0, 7)), 1)) {
    const end = lastDayOfMonth(start.slice(0, 7));
    out.push({ from: start, to: end < to ? end : to });
  }
  return out;
}

// Where the daily sync starts reading: a few nights before the latest stored one.
export function recentFrom(latest: string | null, today: string) {
  const from = latest ? addDays(latest < today ? latest : today, -CPAP_OVERLAP_DAYS) : addDays(today, -CPAP_RECENT_DAYS);
  return from < BACKFILL_FLOOR ? BACKFILL_FLOOR : from;
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const round = (v: number, places = 0) => Math.round(v * 10 ** places) / 10 ** places;

export type CpapMonth = {
  month: string;
  date: string;
  nights: number;
  usedNights: number;
  compliantNights: number;
  usage: number | null;
  ahi: number | null;
  leak: number | null;
  maskPairs: number | null;
  score: number | null;
};

export type CpapKey = "usage" | "ahi" | "leak" | "maskPairs" | "score";

// Values for each calendar month before `beforeMonth` (YYYY-MM). Usage averages every night myAir
// has a record for (zero-use nights count, as for compliance); the others average the nights the
// machine was used. A value is null below MIN_NIGHTS nights.
export function monthlyCpap(nights: CpapNight[], beforeMonth: string): CpapMonth[] {
  const months = new Map<string, CpapNight[]>();
  for (const n of nights) {
    const m = n.date.slice(0, 7);
    if (m < beforeMonth) months.set(m, [...(months.get(m) ?? []), n]);
  }
  return [...months]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, ns]) => {
      const withUsage = ns.filter((n) => n.usageMinutes != null);
      const used = ns.filter((n) => (n.usageMinutes ?? 0) > 0);
      const avg = (pick: (n: CpapNight) => number | null, places: number) => {
        const xs = used.map(pick).filter((v): v is number => v != null);
        return xs.length >= MIN_NIGHTS ? round(mean(xs), places) : null;
      };
      return {
        month,
        date: lastDayOfMonth(month),
        nights: withUsage.length,
        usedNights: used.length,
        compliantNights: ns.filter((n) => (n.usageMinutes ?? 0) >= 240).length,
        usage: withUsage.length >= MIN_NIGHTS ? round(mean(withUsage.map((n) => n.usageMinutes!))) : null,
        ahi: avg((n) => n.ahi, 1),
        leak: avg((n) => n.leak, 1),
        maskPairs: avg((n) => n.maskPairs, 1),
        score: avg((n) => n.score, 0),
      };
    });
}

export type CpapBiomarker = {
  key: CpapKey;
  name: string;
  unit: string | null;
  valueType: "duration" | "number";
  refLow: string | null;
  refHigh: string | null;
  note: (m: CpapMonth) => string;
};

const SOURCE = "ResMed myAir.";

// The biomarkers the myAir sync writes, all in the Sleep category. Ranges only where there is a
// standard: compliance is at least 4 h a night, an AHI under 5 is normal, and ResMed flags a 95th
// percentile leak above 24 L/min.
export const CPAP_BIOMARKERS: CpapBiomarker[] = [
  {
    key: "usage",
    name: "CPAP Usage (Monthly)",
    unit: null,
    valueType: "duration",
    refLow: "240",
    refHigh: null,
    note: (m) =>
      `Mean CPAP use per night over ${m.nights} nights with a record (${m.usedNights} used, ${m.compliantNights} at 4 h or more). ${SOURCE}`,
  },
  {
    key: "ahi",
    name: "CPAP AHI (Monthly)",
    unit: "events/h",
    valueType: "number",
    refLow: null,
    refHigh: "5",
    note: (m) => `Mean apnea-hypopnea index over ${m.usedNights} nights of use. ${SOURCE}`,
  },
  {
    key: "leak",
    name: "CPAP Mask Leak (Monthly)",
    unit: "L/min",
    valueType: "number",
    refLow: null,
    refHigh: "24",
    note: (m) => `Mean of the nightly 95th percentile mask leak over ${m.usedNights} nights of use. ${SOURCE}`,
  },
  {
    key: "maskPairs",
    name: "CPAP Mask On/Off (Monthly)",
    unit: "per night",
    valueType: "number",
    refLow: null,
    refHigh: null,
    note: (m) => `Mean mask on/off count per night over ${m.usedNights} nights of use. ${SOURCE}`,
  },
  {
    key: "score",
    name: "myAir Score (Monthly)",
    unit: "points",
    valueType: "number",
    refLow: null,
    refHigh: null,
    note: (m) => `Mean nightly myAir score (0-100) over ${m.usedNights} nights of use. ${SOURCE}`,
  },
];
