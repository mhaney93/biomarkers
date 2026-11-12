// Biomarkers measured by more than one source. Each measured thing is one biomarker: its primary
// source's readings drive the headline value, range flag and staleness, and every source's readings
// are drawn on its chart (never averaged). Each source keeps its own biomarker row and readings in
// the database; a secondary source's place in its group/category lists the shared biomarker instead.
// Keyed by biomarker id (the trailing comment is the biomarker name), like range-notes.ts.

export type MultiSource = {
  primaryId: string;
  primarySource: string;
  secondaries: { id: string; source: string }[];
};

export const MULTI_SOURCE: MultiSource[] = [
  {
    primaryId: "540a74f3-f0a8-4132-b02f-d759a0a3b2da", // Body Weight (Vitals)
    primarySource: "Daily scale",
    secondaries: [{ id: "20aa0e37-0656-4419-bae1-6cb674c78269", source: "DEXA scan" }], // Intake Weight
  },
];

export type Source = { biomarkerId: string; source: string; primary: boolean };

/** Every source of a biomarker, primary first, or null when it has only its own readings. */
export function getSources(id: string, config: MultiSource[] = MULTI_SOURCE): Source[] | null {
  const entry = config.find((m) => m.primaryId === id);
  if (!entry) return null;
  return [
    { biomarkerId: entry.primaryId, source: entry.primarySource, primary: true },
    ...entry.secondaries.map((s) => ({ biomarkerId: s.id, source: s.source, primary: false })),
  ];
}

/** The biomarker a secondary source belongs to, or null when the id is not a secondary source. */
export function getPrimaryId(id: string, config: MultiSource[] = MULTI_SOURCE): string | null {
  return config.find((m) => m.secondaries.some((s) => s.id === id))?.primaryId ?? null;
}

type Listed = { id: string; group: string | null; category: string | null; count: number };

/**
 * Replaces each secondary source with its primary biomarker, placed in the secondary's own group
 * and category, so the shared biomarker shows up everywhere one of its sources lives. Counts cover
 * every source's readings. A secondary whose primary is missing stays as it is.
 */
export function applyMultiSource<T extends Listed>(all: T[], config: MultiSource[] = MULTI_SOURCE): T[] {
  const byId = new Map(all.map((b) => [b.id, b]));
  const totals = new Map<string, number>();
  for (const m of config) {
    const primary = byId.get(m.primaryId);
    if (!primary) continue;
    totals.set(m.primaryId, m.secondaries.reduce((n, s) => n + (byId.get(s.id)?.count ?? 0), primary.count));
  }
  return all.map((b) => {
    const primaryId = getPrimaryId(b.id, config);
    const primary = primaryId ? byId.get(primaryId) : undefined;
    if (primary) return { ...primary, group: b.group, category: b.category, count: totals.get(primary.id)! };
    if (totals.has(b.id)) return { ...b, count: totals.get(b.id)! };
    return b;
  });
}

/** One entry per biomarker id, keeping the first placement. */
export function uniqueById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((b) => !seen.has(b.id) && (seen.add(b.id), true));
}
