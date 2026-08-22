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

export const statusLabels: Record<Status, string> = {
  low: "Low",
  normal: "In range",
  high: "High",
  "no-range": "No range set",
  "no-reading": "No readings yet",
};
