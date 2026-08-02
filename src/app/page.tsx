import { Card, CardContent } from "@/components/ui/card";
import { AddBiomarkerDialog } from "@/components/add-biomarker-dialog";
import { UnlockDialog } from "@/components/unlock-dialog";
import { BiomarkerCard } from "@/components/biomarker-card";
import { CategoryCard } from "@/components/category-card";
import { getBiomarkersWithLatest, groupByCategory } from "@/lib/biomarkers";
import { isAuthed } from "@/lib/auth";
import { Activity } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [data, authed] = await Promise.all([getBiomarkersWithLatest(), isAuthed()]);
  const { categories, standalone } = groupByCategory(data);

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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {categories.map(({ category, items }) => (
            <CategoryCard key={category} category={category} items={items} />
          ))}
          {standalone.map((b) => (
            <BiomarkerCard key={b.id} b={b} />
          ))}
        </div>
      )}
    </div>
  );
}
