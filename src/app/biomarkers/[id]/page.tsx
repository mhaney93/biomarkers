import { getDb } from "@/db";
import { biomarkers, readings } from "@/db/schema";
import { asc, desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendChart } from "@/components/trend-chart";
import { AddReadingDialog } from "@/components/add-reading-dialog";
import { EditBiomarkerDialog } from "@/components/edit-biomarker-dialog";
import { DeleteBiomarkerButton } from "@/components/delete-biomarker-button";
import { DeleteReadingButton } from "@/components/delete-reading-button";
import { getStatus, statusLabels, statusStyles } from "@/lib/status";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function BiomarkerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = getDb();

  const [biomarker] = await db.select().from(biomarkers).where(eq(biomarkers.id, id));
  if (!biomarker) notFound();

  const allReadings = await db
    .select()
    .from(readings)
    .where(eq(readings.biomarkerId, id))
    .orderBy(asc(readings.takenAt));

  const refLow = biomarker.refLow != null ? Number(biomarker.refLow) : null;
  const refHigh = biomarker.refHigh != null ? Number(biomarker.refHigh) : null;

  const chartData = allReadings.map((r) => ({
    takenAt: r.takenAt,
    value: Number(r.value),
  }));

  const latest = allReadings[allReadings.length - 1] ?? null;
  const latestStatus = getStatus(latest ? Number(latest.value) : null, refLow, refHigh);

  const sortedDesc = [...allReadings].sort(
    (a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime()
  );

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        All biomarkers
      </Link>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{biomarker.name}</h1>
            <Badge variant="outline" className={statusStyles[latestStatus]}>
              {statusLabels[latestStatus]}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {biomarker.category ? `${biomarker.category} · ` : ""}
            {biomarker.unit ? `Unit: ${biomarker.unit}` : "No unit"}
            {refLow != null || refHigh != null
              ? ` · Reference: ${refLow ?? "–"}–${refHigh ?? "–"}`
              : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AddReadingDialog
            biomarkerId={biomarker.id}
            biomarkerName={biomarker.name}
            unit={biomarker.unit}
          />
          <EditBiomarkerDialog biomarker={biomarker} />
          <DeleteBiomarkerButton id={biomarker.id} name={biomarker.name} />
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <TrendChart data={chartData} unit={biomarker.unit} refLow={refLow} refHigh={refHigh} />
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No readings yet — add one to see the trend.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Readings</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedDesc.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No readings yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedDesc.map((r) => {
                  const value = Number(r.value);
                  const status = getStatus(value, refLow, refHigh);
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(r.takenAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {value}
                        {biomarker.unit ? ` ${biomarker.unit}` : ""}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusStyles[status]}>
                          {statusLabels[status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[240px] truncate text-muted-foreground">
                        {r.notes ?? ""}
                      </TableCell>
                      <TableCell>
                        <DeleteReadingButton id={r.id} biomarkerId={biomarker.id} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
