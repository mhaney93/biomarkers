import { formatDuration } from "@/lib/duration";

// Units whose numbers are a time of day in decimal hours (values >= 24 are after midnight).
const CLOCK_UNITS = new Set(["h (24 = midnight)", "h (6.5 = 6:30 AM)"]);

export const isClockUnit = (unit: string | null | undefined) => unit != null && CLOCK_UNITS.has(unit);

// "2:15 AM" from decimal clock hours, wrapping past 24 (26.25 -> 2:15 AM); nearest minute.
export function formatClockHours(hours: number) {
  const m = ((Math.round(hours * 60) % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  return `${h % 12 || 12}:${String(m % 60).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

// A value whose display replaces the number and unit entirely (durations and clock times).
export function isSpecialFormat(valueType: string | null | undefined, unit: string | null | undefined) {
  return valueType === "duration" || isClockUnit(unit);
}

// The display text for a numeric value: "7h 30m", "2:15 AM", or "12.3 mg/dL".
export function formatValue(value: number, valueType: string | null | undefined, unit: string | null | undefined) {
  if (valueType === "duration") return formatDuration(value);
  if (isClockUnit(unit)) return formatClockHours(value);
  return unit ? `${value} ${unit}` : `${value}`;
}

// "low–high" reference text, with "–" for a missing bound.
export function formatRange(
  low: number | null,
  high: number | null,
  valueType: string | null | undefined,
  unit: string | null | undefined,
) {
  const f = (v: number | null) =>
    v == null ? "–" : isSpecialFormat(valueType, unit) ? formatValue(v, valueType, unit) : `${v}`;
  return `${f(low)}–${f(high)}`;
}
