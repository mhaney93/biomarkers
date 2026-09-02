import { Card, CardContent } from "@/components/ui/card";
import { AddBiomarkerDialog } from "@/components/add-biomarker-dialog";
import { UnlockDialog } from "@/components/unlock-dialog";
import { BiomarkersBrowser } from "@/components/biomarkers-browser";
import { IssuesSection } from "@/components/issues-section";
import { getBiomarkersWithLatest, getIssues, getMaxDeltaPercent, groupHierarchy } from "@/lib/biomarkers";
import { isAuthed } from "@/lib/auth";
import { Activity } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [data, authed] = await Promise.all([getBiomarkersWithLatest(), isAuthed()]);
  const { groups, categories, standalone } = groupHierarchy(data);
  const hierarchy = { groups, categories, standalone };
  const issues = getIssues(data);
  const maxPercent = getMaxDeltaPercent(data);

  return (
    <div className="mx-auto max-w-[100rem] px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Biomarkers</h1>
        {authed ? <AddBiomarkerDialog /> : <UnlockDialog />}
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
