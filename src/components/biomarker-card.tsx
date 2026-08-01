import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getStatus, statusLabels, statusStyles } from "@/lib/status";
import { format } from "date-fns";
import type { BiomarkerWithLatest } from "@/lib/biomarkers";

export function BiomarkerCard({ b, showCategory = true }: { b: BiomarkerWithLatest; showCategory?: boolean }) {
  const value = b.latest ? Number(b.latest.value) : null;
  const refLow = b.refLow != null ? Number(b.refLow) : null;
  const refHigh = b.refHigh != null ? Number(b.refHigh) : null;
  const status = getStatus(value, refLow, refHigh);

  return (
    <Link href={`/biomarkers/${b.id}`}>
      <Card className="h-full transition-colors hover:border-foreground/20">
        <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
          <div>
            <p className="font-medium leading-tight">{b.name}</p>
            {showCategory && b.category && (
              <p className="text-xs text-muted-foreground">{b.category}</p>
            )}
          </div>
          <Badge variant="outline" className={statusStyles[status]}>
            {statusLabels[status]}
          </Badge>
        </CardHeader>
        <CardContent>
          {b.latest ? (
            <>
              <p className="text-2xl font-semibold tabular-nums">
                {value}
                {b.unit && <span className="text-sm font-normal text-muted-foreground"> {b.unit}</span>}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(b.latest.takenAt), "MMM d, yyyy")} · {b.count} reading
                {b.count === 1 ? "" : "s"}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No readings yet</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
