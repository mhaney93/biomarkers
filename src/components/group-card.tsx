import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Layers } from "lucide-react";
import type { BiomarkerWithLatest } from "@/lib/biomarkers";

export function GroupCard({ group, items }: { group: string; items: BiomarkerWithLatest[] }) {
  const categoryCount = new Set(items.map((i) => i.category).filter(Boolean)).size;

  return (
    <Link href={`/groups/${encodeURIComponent(group)}`}>
      <Card className="h-full transition-colors hover:border-foreground/20">
        <CardHeader className="flex flex-row items-center gap-2 space-y-0">
          <Layers className="h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="min-w-0 truncate font-medium leading-tight">{group}</p>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {items.length} biomarker{items.length === 1 ? "" : "s"}
            {categoryCount > 0 ? ` · ${categoryCount} categor${categoryCount === 1 ? "y" : "ies"}` : ""}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
