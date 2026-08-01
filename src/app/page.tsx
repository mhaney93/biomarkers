import { getDb } from "@/db";
import { biomarkers, readings } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddBiomarkerDialog } from "@/components/add-biomarker-dialog";
import { getStatus, statusLabels, statusStyles } from "@/lib/status";
import { format } from "date-fns";
import { Activity } from "lucide-react";

export const dynamic = "force-dynamic";

async function getBiomarkersWithLatest() {
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

export default async function Home() {
  const data = await getBiomarkersWithLatest();

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Biomarkers</h1>
          <p className="text-sm text-muted-foreground">
            Track your lab results and health metrics over time.
          </p>
        </div>
        <AddBiomarkerDialog />
      </div>

      {data.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Activity className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="font-medium">No biomarkers yet</p>
              <p className="text-sm text-muted-foreground">
                Add a biomarker like cholesterol, glucose, or vitamin D to start tracking.
              </p>
            </div>
            <AddBiomarkerDialog />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((b) => {
            const value = b.latest ? Number(b.latest.value) : null;
            const refLow = b.refLow != null ? Number(b.refLow) : null;
            const refHigh = b.refHigh != null ? Number(b.refHigh) : null;
            const status = getStatus(value, refLow, refHigh);

            return (
              <Link key={b.id} href={`/biomarkers/${b.id}`}>
                <Card className="h-full transition-colors hover:border-foreground/20">
                  <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
                    <div>
                      <p className="font-medium leading-tight">{b.name}</p>
                      {b.category && (
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
                          {value} <span className="text-sm font-normal text-muted-foreground">{b.unit}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(b.latest.takenAt), "MMM d, yyyy")} · {b.count}{" "}
                          reading{b.count === 1 ? "" : "s"}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">No readings yet</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
