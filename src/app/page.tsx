import { Card, CardContent } from "@/components/ui/card";
import { AddBiomarkerDialog } from "@/components/add-biomarker-dialog";
import { UnlockDialog } from "@/components/unlock-dialog";
import { BiomarkersBrowser } from "@/components/biomarkers-browser";
import { IssuesSection } from "@/components/issues-section";
import { getBiomarkersWithLatest, getIssues, getMaxDeltaPercent, groupHierarchy } from "@/lib/biomarkers";
import { isAuthed } from "@/lib/auth";
import { Activity } from "lucide-react";
import { SyncButtons } from "@/components/sync-buttons";
import { myAirSyncStatus, sleepSyncStatus } from "@/lib/sync-status";

export const dynamic = "force-dynamic";
// The sync buttons' server actions read up to a year of nights per call.
export const maxDuration = 60;

export default async function Home({ searchParams }: { searchParams: Promise<{ google?: string; reason?: string }> }) {
  const [data, authed, googleParam] = await Promise.all([getBiomarkersWithLatest(), isAuthed(), searchParams]);
  const [googleStatus, myAirStatus] = authed ? await Promise.all([sleepSyncStatus(), myAirSyncStatus()]) : [null, null];
  const { groups, categories, standalone } = groupHierarchy(data);
  const hierarchy = { groups, categories, standalone };
  const issues = getIssues(data);
  const maxPercent = getMaxDeltaPercent(data);

  return (
    <div className="mx-auto max-w-[100rem] px-6 py-10">
      <div className="mb-8 flex items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Biomarkers</h1>
        <div className="flex flex-col items-end gap-2">
          {authed ? <AddBiomarkerDialog /> : <UnlockDialog />}
          {googleStatus && myAirStatus && <SyncButtons google={googleStatus} myAir={myAirStatus} googleParam={googleParam} />}
        </div>
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
            {authed ? <AddBiomarkerDialog /> : <UnlockDialog />}
          </CardContent>
        </Card>
      ) : (
        <BiomarkersBrowser data={data} hierarchy={hierarchy} maxPercent={maxPercent} />
      )}

      <IssuesSection issues={issues} />
    </div>
  );
}
