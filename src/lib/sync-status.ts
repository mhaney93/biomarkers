// Status for the home page's Google Health / ResMed myAir buttons.
import { googleConfigured } from "@/lib/google";
import { getGoogleStatus } from "@/lib/sleep-sync";
import { myAirConfigured } from "@/lib/myair";
import { getMyAirStatus } from "@/lib/myair-sync";
import type { SleepSyncStatus, MyAirSyncStatus } from "@/components/sync-buttons";

export async function sleepSyncStatus(): Promise<SleepSyncStatus> {
  const s = await getGoogleStatus();
  return {
    configured: googleConfigured(),
    connected: s != null,
    hasSleepScope: s?.hasSleepScope ?? false,
    hasActivityScope: s?.hasActivityScope ?? false,
    syncedTo: s?.sleepSyncedTo ?? null,
    lastSyncAt: s?.lastSyncAt?.toISOString() ?? null,
    lastSync: s?.lastSync ?? null,
  };
}

// The myAir tables are only read once its credentials are set.
export async function myAirSyncStatus(): Promise<MyAirSyncStatus> {
  const configured = myAirConfigured();
  const s = configured ? await getMyAirStatus() : null;
  return {
    configured,
    backfillFrom: s?.backfillFrom ?? null,
    backfillDone: s?.backfillDone ?? false,
    codeSent: s?.mfaSentAt != null,
    lastSyncAt: s?.lastSyncAt?.toISOString() ?? null,
    lastSync: s?.lastSync ?? null,
  };
}
