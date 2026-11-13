import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { allergenBadgeLabel, getAllergenBadgeProps, getBadgeProps, statusLabels } from "@/lib/status";
import { formatValue, formatRange, isSpecialFormat } from "@/lib/display";
import { AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ageInDays } from "@/lib/staleness";
import { formatDistanceToNowStrict } from "date-fns";
import type { Issue, RetestDue } from "@/lib/biomarkers";

function RetestDueList({ items }: { items: RetestDue[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-6">
      <div className="mb-2 flex items-center gap-2">
        <h3 className="text-base font-semibold tracking-tight">Due for a retest</h3>
        <span className="text-sm text-muted-foreground">last result out of range, but too old to count as current</span>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {items.map(({ biomarker: b, value }) => {
              const takenAt = b.latest!.takenAt;
              return (
                <Link
                  key={b.id}
                  href={`/biomarkers/${b.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-2 text-sm transition-colors hover:bg-muted/50"
                >
                  <span className="min-w-0 truncate font-medium">{b.name}</span>
                  <span className="shrink-0 text-right tabular-nums text-muted-foreground">
                    {isSpecialFormat(b.valueType, b.unit) && value != null ? formatValue(value, b.valueType, b.unit) : value}
                    {!isSpecialFormat(b.valueType, b.unit) && b.unit && ` ${b.unit}`} · {format(new Date(takenAt), "MMM d, yyyy")} ·{" "}
                    {ageInDays(takenAt) >= 1
                      ? `${formatDistanceToNowStrict(new Date(takenAt))} ago`
                      : "today"}
                  </span>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function IssuesSection({ issues, retestDue }: { issues: Issue[]; retestDue: RetestDue[] }) {
  if (issues.length === 0 && retestDue.length === 0) return null;
  if (issues.length === 0)
    return (
      <div className="mt-10">
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold tracking-tight">Issues</h2>
          <span className="text-sm text-muted-foreground">none current</span>
        </div>
        <RetestDueList items={retestDue} />
      </div>
    );

  const maxPercent = issues[0]?.percent ?? 0;

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
            {issues.map(({ biomarker: b, value, refLow, refHigh, status, percent, allergen }) => (
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
                      {isSpecialFormat(b.valueType, b.unit) && value != null ? (
                        formatValue(value, b.valueType, b.unit)
                      ) : (
                        <>
                          {value}
                          {b.unit && <span className="text-muted-foreground"> {b.unit}</span>}
                        </>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ref{" "}
                      {formatRange(refLow, refHigh, b.valueType, b.unit)}
                    </p>
                    {b.latest && (
                      <p className="text-xs text-muted-foreground">
                        as of {format(new Date(b.latest.takenAt), "MMM d, yyyy")}
                      </p>
                    )}
                  </div>
                  {(() => {
                    const badge = allergen
                      ? getAllergenBadgeProps(status, allergen)
                      : getBadgeProps(status, percent, maxPercent);
                    return (
                      <Badge variant="outline" className={badge.className} style={badge.style}>
                        {allergen
                          ? allergenBadgeLabel(allergen)
                          : percent != null
                            ? `${Math.round(percent)}% ${statusLabels[status].toLowerCase()}`
                            : statusLabels[status]}
                      </Badge>
                    );
                  })()}
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
      <RetestDueList items={retestDue} />
    </div>
  );
}
