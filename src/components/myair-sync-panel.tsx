"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { sendMyAirCodeNow, syncMyAirNow, verifyMyAirCodeNow } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MyAirSyncResult } from "@/lib/myair-sync";

export type MyAirSyncStatus = {
  configured: boolean;
  backfillFrom: string | null;
  backfillDone: boolean;
  codeSent: boolean;
  lastSyncAt: string | null;
  lastSync: MyAirSyncResult | null;
};

// A run backfills months until its time budget is used; a full backfill takes a few.
const MAX_RUNS = 30;

function summary(r: MyAirSyncResult) {
  if (r.error) return r.message ?? r.error;
  if (r.more) return `Backfilled to ${r.backfillFrom?.slice(0, 7)}; more to go`;
  const p = r.published;
  const n = (k: number) => `${k} monthly value${k === 1 ? "" : "s"}`;
  return `Synced; ${n(p?.added.length ?? 0)} added${p?.updated.length ? `, ${n(p.updated.length)} updated` : ""}`;
}

export function MyAirSyncPanel({ status }: { status: MyAirSyncStatus }) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [code, setCode] = useState("");
  const last = status.lastSync;
  const needsCode = last?.error === "mfa" || status.codeSent;

  const sync = useCallback(async () => {
    setRunning(true);
    try {
      let r: MyAirSyncResult;
      let runs = 0;
      do {
        r = await syncMyAirNow();
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

  const sendCode = async () => {
    setRunning(true);
    const r = await sendMyAirCodeNow();
    setRunning(false);
    router.refresh();
    if (r.error) toast.error(r.error);
    else if (r.sent) toast.success("myAir emailed a code");
    else {
      toast.success("Signed in to myAir; no code needed");
      void sync();
    }
  };

  const verify = async () => {
    setRunning(true);
    const r = await verifyMyAirCodeNow(code);
    setRunning(false);
    if (r.error) {
      toast.error(r.error);
      return;
    }
    setCode("");
    toast.success("myAir signed in");
    void sync();
  };

  return (
    <div className="mb-8 rounded-lg border p-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="font-medium">ResMed myAir sync</p>
          <p className="text-muted-foreground">
            {!status.configured
              ? "myAir isn't configured (MYAIR_USERNAME / MYAIR_PASSWORD)."
              : !status.lastSyncAt
                ? "Not synced yet. Syncing reads every CPAP night myAir has (usage, AHI, leak, mask on/off, score)."
                : `${status.backfillDone ? "History complete" : `History read back to ${status.backfillFrom?.slice(0, 7) ?? "-"}`}; latest night ${
                    last?.latest ?? "-"
                  }. Last sync ${new Date(status.lastSyncAt).toLocaleString()}${last ? `: ${summary(last)}` : ""}. Syncs daily.`}
          </p>
        </div>
        {status.configured && (
          <div className="flex gap-2">
            {needsCode && (
              <Button size="sm" variant="outline" onClick={sendCode} disabled={running}>
                {status.codeSent ? "Resend code" : "Send code"}
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={sync} disabled={running}>
              <RefreshCw className={`h-4 w-4 ${running ? "animate-spin" : ""}`} />
              {running ? "Syncing..." : "Sync myAir"}
            </Button>
          </div>
        )}
      </div>

      {status.configured && status.codeSent && (
        <form
          className="mt-3 flex max-w-xs gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void verify();
          }}
        >
          <Input
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="Code from the myAir email"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <Button size="sm" type="submit" disabled={running || !code.trim()}>
            Verify
          </Button>
        </form>
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
