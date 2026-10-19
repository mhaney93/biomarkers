import type { CSSProperties } from "react";

export type Status = "low" | "normal" | "high" | "no-range" | "no-reading";

export function getStatus(
  value: number | null | undefined,
  refLow: number | null | undefined,
  refHigh: number | null | undefined
): Status {
  if (value == null) return "no-reading";
  if (refLow == null && refHigh == null) return "no-range";
  if (refLow != null && value < refLow) return "low";
  if (refHigh != null && value > refHigh) return "high";
  return "normal";
}

export const statusStyles: Record<Status, string> = {
  low: "bg-[#eda100]/15 text-[#c98500] border-[#eda100]/30",
  normal: "bg-[#0ca30c]/15 text-[#0ca30c] border-[#0ca30c]/30",
  high: "bg-[#d03b3b]/15 text-[#d03b3b] border-[#d03b3b]/30",
  "no-range": "bg-muted text-muted-foreground border-border",
  "no-reading": "bg-muted text-muted-foreground border-border",
};

export function percentOutOfRange(
  value: number | null | undefined,
  refLow: number | null | undefined,
  refHigh: number | null | undefined
): number | null {
  const status = getStatus(value, refLow, refHigh);
  if (value == null) return null;
  if (status === "low" && refLow) return ((refLow - value) / refLow) * 100;
  if (status === "high" && refHigh) return ((value - refHigh) / refHigh) * 100;
  return null;
}

const SEVERITY_FROM = [0xed, 0xa1, 0x00] as const; // yellow, matches previous "low" color
const SEVERITY_TO = [0xd0, 0x3b, 0x3b] as const; // red, matches previous "high" color

export function severityStyle(percent: number, maxPercent: number): CSSProperties {
  const t = maxPercent > 0 ? Math.min(Math.max(percent / maxPercent, 0), 1) : 0;
  const [r, g, b] = SEVERITY_FROM.map((from, i) => Math.round(from + (SEVERITY_TO[i] - from) * t));
  return {
    backgroundColor: `rgba(${r}, ${g}, ${b}, 0.15)`,
    color: `rgb(${r}, ${g}, ${b})`,
    borderColor: `rgba(${r}, ${g}, ${b}, 0.3)`,
  };
}

export function getBadgeProps(
  status: Status,
  percent: number | null,
  maxPercent: number
): { className: string; style?: CSSProperties } {
  if ((status === "low" || status === "high") && percent != null) {
    return { className: "", style: severityStyle(percent, maxPercent) };
  }
  return { className: statusStyles[status] };
}

// Allergen-specific IgE results (e.g. "Peanut (F13) IgE", in kU/L) are graded on the lab's 0–6
// class scale. Their reference limit sits at the assay's detection floor (0.09 kU/L), so the
// percent-past-range used elsewhere would read in the thousands and swamp every other severity.
const ALLERGEN_CLASSES = [
  { min: 0, label: "0", level: "Absent" },
  { min: 0.1, label: "0/1", level: "Very low" },
  { min: 0.35, label: "1", level: "Low" },
  { min: 0.7, label: "2", level: "Moderate" },
  { min: 3.5, label: "3", level: "High" },
  { min: 17.5, label: "4", level: "Very high" },
  { min: 50, label: "5", level: "Very high" },
  { min: 100, label: "6", level: "Very high" }, // class 5 includes 100 itself; 6 is above it
] as const;

export type AllergenClass = { rank: number; label: string; level: string };

export function isAllergenIgE(b: { name: string; unit: string | null }): boolean {
  return b.unit === "kU/L" && /\bIgE$/.test(b.name);
}

export function getAllergenClass(value: number | null | undefined): AllergenClass | null {
  if (value == null) return null;
  let rank = 0;
  ALLERGEN_CLASSES.forEach((c, i) => {
    if (value > c.min || (value === c.min && c.label !== "6")) rank = i;
  });
  const { label, level } = ALLERGEN_CLASSES[rank];
  return { rank, label, level };
}

export function getAllergenBadgeProps(
  status: Status,
  allergen: AllergenClass
): { className: string; style?: CSSProperties } {
  if (status === "high" && allergen.rank > 0) {
    return { className: "", style: severityStyle(allergen.rank, ALLERGEN_CLASSES.length - 1) };
  }
  return { className: statusStyles[status] };
}

export function allergenBadgeLabel(allergen: AllergenClass): string {
  return `Class ${allergen.label} · ${allergen.level}`;
}

export const statusLabels: Record<Status, string> = {
  low: "Low",
  normal: "In range",
  high: "High",
  "no-range": "No range set",
  "no-reading": "No readings yet",
};
