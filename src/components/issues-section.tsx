import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { statusLabels, statusStyles } from "@/lib/status";
import { formatDuration } from "@/lib/duration";
import { AlertTriangle } from "lucide-react";
import type { Issue } from "@/lib/biomarkers";

export function IssuesSection({ issues }: { issues: Issue[] }) {
  if (issues.length === 0) return null;

  return (
    <div className="mt-10">
      <div className="mb-4 flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-xl font-semibold tracking-tight">Issues</h2>
        <span className="text-sm text-muted-foreground">
          {issues.length} biomarker{issues.length === 1 ? "" : "s"} out of range
        </span>
      </div>

      <Card>
        <CardHeader className="sr-only">
          <CardTitle>Out of range biomarkers</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {issues.map(({ biomarker: b, value, refLow, refHigh, status, percent }) => (
              <Link
                key={b.id}
                href={`/biomarkers/${b.id}`}
                className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-muted/50"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium leading-tight">{b.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[b.group, b.category].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <div className="text-right">
                    <p className="tabular-nums leading-tight">
                      {b.valueType === "duration" && value != null ? (
                        formatDuration(value)
                      ) : (
                        <>
                          {value}
                          {b.unit && <span className="text-muted-foreground"> {b.unit}</span>}
                        </>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ref{" "}
                      {b.valueType === "duration"
                        ? `${refLow != null ? formatDuration(refLow) : "–"}–${refHigh != null ? formatDuration(refHigh) : "–"}`
                        : `${refLow ?? "–"}–${refHigh ?? "–"}`}
                    </p>
                  </div>
                  <Badge variant="outline" className={statusStyles[status]}>
                    {percent != null ? `${Math.round(percent)}% ${statusLabels[status].toLowerCase()}` : statusLabels[status]}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
