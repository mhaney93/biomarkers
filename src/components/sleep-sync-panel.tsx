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
  const added = `Synced; ${p.added.length} new monthly value${p.added.length === 1 ? "" : "s"}`;
  return p.held ? `${added}; sleep duration held: it disagrees with the hand-entered months` : added;
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
      if (r.error || r.published?.held) toast.error(summary(r));
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
  const comparison = last?.published?.held ? last.published.comparison : null;
  const changed = last?.published?.changed ?? [];

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

      {comparison && (
        <div className="mt-4">
          <p className="mb-2 text-destructive">
            Computed sleep duration differs from the hand-entered months by a median of {comparison.medianAbsDiff} min,
            so sleep duration is not published until the definition is settled. The other metrics still are.
          </p>
          <table className="text-xs">
            <thead className="text-muted-foreground">
              <tr>
                <th className="pr-4 text-left font-normal">Month</th>
                <th className="pr-4 text-right font-normal">Site</th>
                <th className="pr-4 text-right font-normal">Google</th>
                <th className="text-right font-normal">Diff</th>
              </tr>
            </thead>
            <tbody>
              {comparison.rows.map((r) => (
                <tr key={r.month}>
                  <td className="pr-4">{r.month}</td>
                  <td className="pr-4 text-right">{r.site}</td>
                  <td className="pr-4 text-right">{r.google}</td>
                  <td className="text-right">{r.diff > 0 ? `+${r.diff}` : r.diff}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {changed.length > 0 && (
        <details className="mt-3 text-muted-foreground">
          <summary>
            {changed.length} month{changed.length === 1 ? "" : "s"} where Google now differs from the site (kept the site&apos;s)
          </summary>
          <ul className="mt-1 list-disc pl-5 text-xs">
            {changed.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </details>
      )}

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
