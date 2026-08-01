import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Folder } from "lucide-react";
import type { BiomarkerWithLatest } from "@/lib/biomarkers";

export function CategoryCard({ category, items }: { category: string; items: BiomarkerWithLatest[] }) {
  return (
    <Link href={`/categories/${encodeURIComponent(category)}`}>
      <Card className="h-full transition-colors hover:border-foreground/20">
        <CardHeader className="flex flex-row items-center gap-2 space-y-0">
          <Folder className="h-4 w-4 text-muted-foreground" />
          <p className="font-medium leading-tight">{category}</p>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {items.length} biomarker{items.length === 1 ? "" : "s"}
          </p>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {items.map((i) => i.name).join(", ")}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
