// How old a reading can get before an out-of-range result stops counting as a current issue.
// Stale results are listed under "Due for a retest" instead: a bad value never retested is unknown, not fixed.
export const STALE_AFTER_DAYS = {
  labs: 365, // blood work, DEXA, allergy panels and other lab results
  daily: 14, // synced wearable-type readings (sleep, heart rate, SpO2, CPAP)
  vitals: 30, // blood pressure and weight
} as const;

export type MeasurementKind = keyof typeof STALE_AFTER_DAYS;

const DAILY_CATEGORIES = new Set(["sleep", "cpap", "heart rate", "spo2"]);
const VITALS_PATTERN = /blood pressure|systolic|diastolic|\bweight\b/i;
const DAILY_PATTERN = /heart rate|spo2|respiratory rate|skin temp|vo2|cpap|\bahi\b/i;

export function getMeasurementKind(b: { name: string; category: string | null }): MeasurementKind {
  if (VITALS_PATTERN.test(b.name) && !/intake/i.test(b.name)) return "vitals";
  if (b.category && DAILY_CATEGORIES.has(b.category.toLowerCase())) return "daily";
  if (DAILY_PATTERN.test(b.name)) return "daily";
  return "labs";
}

const MS_PER_DAY = 86_400_000;

// takenAt is a YYYY-MM-DD date; ages are whole UTC days.
export function ageInDays(takenAt: string, now: Date = new Date()): number {
  const taken = Date.parse(`${takenAt.slice(0, 10)}T00:00:00Z`);
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.floor((today - taken) / MS_PER_DAY);
}

// Stale means strictly older than the window; a reading exactly at the window is still current.
export function isStale(
  b: { name: string; category: string | null },
  takenAt: string,
  now: Date = new Date()
): boolean {
  return ageInDays(takenAt, now) > STALE_AFTER_DAYS[getMeasurementKind(b)];
}
