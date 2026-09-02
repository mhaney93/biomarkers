"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { BiomarkerCard } from "@/components/biomarker-card";
import { CategoryCard } from "@/components/category-card";
import { GroupCard } from "@/components/group-card";
import type { BiomarkerWithLatest } from "@/lib/biomarkers";

type Hierarchy = {
  groups: { group: string; items: BiomarkerWithLatest[] }[];
  categories: { category: string; items: BiomarkerWithLatest[] }[];
  standalone: BiomarkerWithLatest[];
};

export function BiomarkersBrowser({
  data,
  hierarchy,
  maxPercent,
}: {
  data: BiomarkerWithLatest[];
  hierarchy: Hierarchy;
  maxPercent: number;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const matches = useMemo(() => {
    if (!q) return [];
    return data
      .filter((b) =>
        [b.name, b.category, b.group, b.unit]
          .filter(Boolean)
          .some((f) => f!.toLowerCase().includes(q))
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data, q]);

  return (
    <div>
      <Input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search biomarkers, categories, groups…"
        className="mb-4 h-9 max-w-sm"
      />

      {q ? (
        matches.length === 0 ? (
          <p className="py-8 text-sm text-muted-foreground">No matches for “{query}”.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {matches.map((b) => (
              <BiomarkerCard key={b.id} b={b} maxPercent={maxPercent} />
            ))}
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {hierarchy.groups.map(({ group, items }) => (
            <GroupCard key={group} group={group} items={items} />
          ))}
          {hierarchy.categories.map(({ category, items }) => (
            <CategoryCard key={category} category={category} items={items} />
          ))}
          {hierarchy.standalone.map((b) => (
            <BiomarkerCard key={b.id} b={b} maxPercent={maxPercent} />
          ))}
        </div>
      )}
    </div>
  );
}
