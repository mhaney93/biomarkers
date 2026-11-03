import { notFound } from "next/navigation";
import { BiomarkerCard } from "@/components/biomarker-card";
import { AddBiomarkerDialog } from "@/components/add-biomarker-dialog";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { RenameCategoryDialog } from "@/components/rename-category-dialog";
import { UnlockDialog } from "@/components/unlock-dialog";
import { getBiomarkersWithLatest, getMaxDeltaPercent } from "@/lib/biomarkers";
import { isAuthed } from "@/lib/auth";
import { SleepSyncPanel, type SleepSyncStatus } from "@/components/sleep-sync-panel";
import { googleConfigured } from "@/lib/google";
import { getGoogleStatus } from "@/lib/sleep-sync";
import { CATEGORY as SLEEP_CATEGORY } from "@/lib/sleep";

export const dynamic = "force-dynamic";
// The Sleep page's "Sync now" server action reads up to a year of nights per call.
export const maxDuration = 60;

async function sleepSyncStatus(): Promise<SleepSyncStatus> {
  const s = await getGoogleStatus();
  return {
    configured: googleConfigured(),
    connected: s != null,
    hasSleepScope: s?.hasSleepScope ?? false,
    syncedTo: s?.sleepSyncedTo ?? null,
    lastSyncAt: s?.lastSyncAt?.toISOString() ?? null,
    lastSync: s?.lastSync ?? null,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ google?: string; reason?: string }>;
}) {
  const { category: encoded } = await params;
  const category = decodeURIComponent(encoded);

  const [data, authed] = await Promise.all([getBiomarkersWithLatest(), isAuthed()]);
  const items = data.filter((b) => b.category === category);
  const maxPercent = getMaxDeltaPercent(data);

  if (items.length === 0) notFound();
  const showSleepSync = authed && category === SLEEP_CATEGORY;
  const [sleepStatus, { google, reason }] = await Promise.all([
    showSleepSync ? sleepSyncStatus() : null,
    searchParams,
  ]);

  return (
    <div className="mx-auto max-w-[100rem] px-6 py-10">
      <Breadcrumbs trail={[{ label: category }]} />

      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">{category}</h1>
          {authed && <RenameCategoryDialog category={category} />}
        </div>
        {authed ? <AddBiomarkerDialog defaultCategory={category} /> : <UnlockDialog />}
      </div>

      {sleepStatus && <SleepSyncPanel status={sleepStatus} googleParam={{ google, reason }} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {items.map((b) => (
          <BiomarkerCard key={b.id} b={b} showCategory={false} maxPercent={maxPercent} />
        ))}
      </div>
    </div>
  );
}
