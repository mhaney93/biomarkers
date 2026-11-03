"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { syncSleepNow } from "@/app/actions";
import { Button } from "@/components/ui/button";
import type { SyncResult } from "@/lib/sleep-sync";

export type SleepSyncStatus = {
  configured: boolean;
  connected: boolean;
  hasSleepScope: boolean;
  syncedTo: string | null;
  lastSyncAt: string | null;
  lastSync: SyncResult | null;
};

// A sync run covers a year of nights within the function time limit; a backfill takes several.
const MAX_RUNS = 30;

function summary(r: SyncResult) {
  if (r.error) return r.message ?? r.error;
  const p = r.published;
  if (r.more) return `Read nights through ${r.syncedTo}; more to go`;
  if (!p) return "Synced";
  const n = (k: number) => `${k} monthly value${k === 1 ? "" : "s"}`;
  return `Synced; ${n(p.added?.length ?? 0)} added${p.updated?.length ? `, ${n(p.updated.length)} updated` : ""}`;
}

export function SleepSyncPanel({ status, googleParam }: { status: SleepSyncStatus; googleParam: { google?: string; reason?: string } }) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const started = useRef(false);

  const sync = useCallback(async () => {
    setRunning(true);
    try {
      let r: SyncResult;
      let runs = 0;
      do {
        r = await syncSleepNow();
        runs++;
        router.refresh();
      } while (r.more && !r.error && runs < MAX_RUNS);
      if (r.error) toast.error(summary(r));
      else toast.success(summary(r));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setRunning(false);
    }
  }, [router]);

  // Back from Google: report the outcome, and run the first sync (the backfill) after connecting.
  useEffect(() => {
    if (started.current || !googleParam.google) return;
    started.current = true;
    router.replace("/categories/Sleep");
    if (googleParam.google === "connected") {
      toast.success("Google connected");
      queueMicrotask(() => void sync());
    } else {
      toast.error(`Google: ${googleParam.reason ?? "connection failed"}`);
    }
  }, [googleParam, router, sync]);

  const last = status.lastSync;
  const needsReconnect = status.connected && (!status.hasSleepScope || last?.error === "reconnect");

  return (
    <div className="mb-8 rounded-lg border p-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="font-medium">Google Health sync</p>
          <p className="text-muted-foreground">
            {!status.configured
              ? "Google OAuth isn't configured (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET)."
              : !status.connected
                ? "Not connected. Connecting reads sleep, resting heart rate and HRV (read-only) and backfills every month Google has."
                : needsReconnect
                  ? `Reconnect needed: ${last?.message ?? "the grant lacks sleep data"}`
                  : `Nights read through ${status.syncedTo ?? "-"}. Last sync ${
                      status.lastSyncAt ? new Date(status.lastSyncAt).toLocaleString() : "never"
                    }${last ? `: ${summary(last)}` : ""}. Syncs daily.`}
          </p>
        </div>
        <div className="flex gap-2">
          {status.configured && (
            <Button size="sm" variant={status.connected && !needsReconnect ? "outline" : "default"} asChild>
              <a href="/api/google/connect">{status.connected ? "Reconnect Google" : "Connect Google"}</a>
            </Button>
          )}
          {status.connected && (
            <Button size="sm" variant="outline" onClick={sync} disabled={running}>
              <RefreshCw className={`h-4 w-4 ${running ? "animate-spin" : ""}`} />
              {running ? "Syncing..." : "Sync now"}
            </Button>
          )}
        </div>
      </div>

      {last && last.warnings.length > 0 && (
        <details className="mt-3 text-muted-foreground">
          <summary>{last.warnings.length} warning(s) on the last sync</summary>
          <ul className="mt-1 list-disc pl-5 text-xs">
            {last.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
