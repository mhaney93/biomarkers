import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getBadgeProps, getStatus, percentOutOfRange, statusLabels } from "@/lib/status";
import { formatDuration } from "@/lib/duration";
import { format } from "date-fns";
import type { BiomarkerWithLatest } from "@/lib/biomarkers";

export function BiomarkerCard({
  b,
  showCategory = true,
  maxPercent = 0,
}: {
  b: BiomarkerWithLatest;
  showCategory?: boolean;
  maxPercent?: number;
}) {
  const isText = b.valueType === "text";
  const value = !isText && b.latest?.value != null ? Number(b.latest.value) : null;
  const refLow = b.refLow != null ? Number(b.refLow) : null;
  const refHigh = b.refHigh != null ? Number(b.refHigh) : null;
  const status = getStatus(value, refLow, refHigh);
  const percent = percentOutOfRange(value, refLow, refHigh);
  const badge = getBadgeProps(status, percent, maxPercent);

  return (
    <Link href={`/biomarkers/${b.id}`}>
      <Card className="h-full transition-colors hover:border-foreground/20">
        <CardHeader className="flex flex-col items-start gap-2 space-y-0">
          <p className="w-full break-words font-medium leading-tight">{b.name}</p>
          <div className="flex w-full items-center justify-between gap-2">
            {showCategory && b.category ? (
              <p className="min-w-0 truncate text-xs text-muted-foreground">{b.category}</p>
            ) : (
              <span />
            )}
            {!isText && (
              <Badge variant="outline" className={`shrink-0 ${badge.className}`} style={badge.style}>
                {statusLabels[status]}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {b.latest ? (
            <>
              {isText ? (
                <p className="line-clamp-2 text-lg font-semibold">{b.latest.textValue}</p>
              ) : (
                <p className="text-2xl font-semibold tabular-nums">
                  {b.valueType === "duration" && value != null ? (
                    formatDuration(value)
                  ) : (
                    <>
                      {value}
                      {b.unit && <span className="text-sm font-normal text-muted-foreground"> {b.unit}</span>}
                    </>
                  )}
                </p>
              )}
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
