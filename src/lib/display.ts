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

// Celsius units shown in Fahrenheit. A "vs baseline" value is a difference, so it scales by 1.8 only.
const FAHRENHEIT: Record<string, { unit: string; toF: (c: number) => number }> = {
  "°C": { unit: "°F", toF: (c) => c * 1.8 + 32 },
  "°C vs baseline": { unit: "°F vs baseline", toF: (c) => c * 1.8 },
};

export const isCelsiusUnit = (unit: string | null | undefined) => unit != null && unit in FAHRENHEIT;

// The unit as displayed (Celsius units become Fahrenheit).
export const displayUnit = (unit: string | null | undefined) => (unit != null && FAHRENHEIT[unit]?.unit) || unit;

// Celsius -> Fahrenheit number for display, to 1 decimal (deltas keep their sign: +0.5).
export function formatFahrenheit(celsius: number, unit: string) {
  const conv = FAHRENHEIT[unit];
  const f = Math.round(conv.toF(celsius) * 10) / 10 || 0;
  return unit === "°C vs baseline" && f > 0 ? `+${f}` : `${f}`;
}

// A value whose display replaces the number and unit entirely (durations and clock times).
export function isSpecialFormat(valueType: string | null | undefined, unit: string | null | undefined) {
  return valueType === "duration" || isClockUnit(unit) || isCelsiusUnit(unit);
}

// The display text for a numeric value: "7h 30m", "2:15 AM", "98.6 °F", or "12.3 mg/dL".
export function formatValue(value: number, valueType: string | null | undefined, unit: string | null | undefined) {
  if (valueType === "duration") return formatDuration(value);
  if (isClockUnit(unit)) return formatClockHours(value);
  if (isCelsiusUnit(unit)) return `${formatFahrenheit(value, unit!)} ${displayUnit(unit)}`;
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
    v == null
      ? "–"
      : isCelsiusUnit(unit)
        ? formatFahrenheit(v, unit!)
        : isSpecialFormat(valueType, unit)
          ? formatValue(v, valueType, unit)
          : `${v}`;
  return `${f(low)}–${f(high)}`;
}
