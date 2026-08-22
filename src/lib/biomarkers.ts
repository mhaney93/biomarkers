import { getDb } from "@/db";
import { biomarkers, readings } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";

export async function getBiomarkersWithLatest() {
  const db = getDb();
  const all = await db.select().from(biomarkers).orderBy(biomarkers.name);

  const withLatest = await Promise.all(
    all.map(async (b) => {
      const latest = await db
        .select()
        .from(readings)
        .where(eq(readings.biomarkerId, b.id))
        .orderBy(desc(readings.takenAt))
        .limit(1);
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(readings)
        .where(eq(readings.biomarkerId, b.id));
      return { ...b, latest: latest[0] ?? null, count };
    })
  );

  return withLatest;
}

export type BiomarkerWithLatest = Awaited<ReturnType<typeof getBiomarkersWithLatest>>[number];

export function groupByCategory(data: BiomarkerWithLatest[]) {
  const byCategory = new Map<string, BiomarkerWithLatest[]>();
  const uncategorized: BiomarkerWithLatest[] = [];

  for (const b of data) {
    if (!b.category) {
      uncategorized.push(b);
      continue;
    }
    const list = byCategory.get(b.category) ?? [];
    list.push(b);
    byCategory.set(b.category, list);
  }

  const categories: { category: string; items: BiomarkerWithLatest[] }[] = [];
  const standalone: BiomarkerWithLatest[] = [...uncategorized];

  for (const [category, items] of byCategory) {
    if (items.length >= 2) {
      categories.push({ category, items });
    } else {
      standalone.push(...items);
    }
  }

  categories.sort((a, b) => a.category.localeCompare(b.category));
  standalone.sort((a, b) => a.name.localeCompare(b.name));

  return { categories, standalone };
}

export function groupHierarchy(data: BiomarkerWithLatest[]) {
  const byGroup = new Map<string, BiomarkerWithLatest[]>();
  const ungrouped: BiomarkerWithLatest[] = [];

  for (const b of data) {
    if (!b.group) {
      ungrouped.push(b);
      continue;
    }
    const list = byGroup.get(b.group) ?? [];
    list.push(b);
    byGroup.set(b.group, list);
  }

  const groups = [...byGroup.entries()]
    .map(([group, items]) => ({ group, items }))
    .sort((a, b) => a.group.localeCompare(b.group));

  const { categories, standalone } = groupByCategory(ungrouped);

  return { groups, categories, standalone };
}

export function groupItemsByCategory(items: BiomarkerWithLatest[]) {
  const byCategory = new Map<string, BiomarkerWithLatest[]>();
  const uncategorized: BiomarkerWithLatest[] = [];

  for (const b of items) {
    if (!b.category) {
      uncategorized.push(b);
      continue;
    }
    const list = byCategory.get(b.category) ?? [];
    list.push(b);
    byCategory.set(b.category, list);
  }

  const categories = [...byCategory.entries()]
    .map(([category, items]) => ({ category, items }))
    .sort((a, b) => a.category.localeCompare(b.category));
  const standalone = uncategorized.sort((a, b) => a.name.localeCompare(b.name));

  return { categories, standalone };
}
