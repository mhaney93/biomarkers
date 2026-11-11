"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { sendMyAirCodeNow, syncMyAirNow, syncSleepNow, verifyMyAirCodeNow } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MyAirSyncResult } from "@/lib/myair-sync";
import type { SyncResult } from "@/lib/sleep-sync";

export type SleepSyncStatus = {
  configured: boolean;
  connected: boolean;
  hasSleepScope: boolean;
  hasActivityScope: boolean;
  syncedTo: string | null;
  lastSyncAt: string | null;
  lastSync: SyncResult | null;
};

export type MyAirSyncStatus = {
  configured: boolean;
  backfillFrom: string | null;
  backfillDone: boolean;
  codeSent: boolean;
  lastSyncAt: string | null;
  lastSync: MyAirSyncResult | null;
};

// A sync run covers a year of nights (or months of myAir) within the function time limit; a backfill takes several.
const MAX_RUNS = 30;

function googleSummary(r: SyncResult) {
  if (r.error) return r.message ?? r.error;
  const p = r.published;
  if (r.more) return `Read nights through ${r.syncedTo}; more to go`;
  if (!p) return "Synced";
  const n = (k: number) => `${k} monthly value${k === 1 ? "" : "s"}`;
  return `Synced; ${n(p.added?.length ?? 0)} added${p.updated?.length ? `, ${n(p.updated.length)} updated` : ""}`;
}

function myAirSummary(r: MyAirSyncResult) {
  if (r.error) return r.message ?? r.error;
  if (r.more) return `Backfilled to ${r.backfillFrom?.slice(0, 7)}; more to go`;
  const p = r.published;
  const n = (k: number) => `${k} monthly value${k === 1 ? "" : "s"}`;
  return `Synced; ${n(p?.added.length ?? 0)} added${p?.updated.length ? `, ${n(p.updated.length)} updated` : ""}`;
}

// Two small buttons under "Add biomarker" on the home page; the last-sync detail is the hover text.
export function SyncButtons({
  google,
  myAir,
  googleParam,
}: {
  google: SleepSyncStatus;
  myAir: MyAirSyncStatus;
  googleParam: { google?: string; reason?: string };
}) {
  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap justify-end gap-2">
        <GoogleHealthButton status={google} googleParam={googleParam} />
        <MyAirButtons status={myAir} />
      </div>
      <MyAirCodeForm status={myAir} />
    </div>
  );
}

function GoogleHealthButton({ status, googleParam }: { status: SleepSyncStatus; googleParam: { google?: string; reason?: string } }) {
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
      if (r.error) toast.error(googleSummary(r));
      else toast.success(googleSummary(r));
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
    router.replace("/");
    if (googleParam.google === "connected") {
      toast.success("Google connected");
      queueMicrotask(() => void sync());
    } else {
      toast.error(`Google: ${googleParam.reason ?? "connection failed"}`);
    }
  }, [googleParam, router, sync]);

  if (!status.configured) return null;
  const last = status.lastSync;
  const needsReconnect = status.connected && (!status.hasSleepScope || last?.error === "reconnect");
  const needsActivity = status.connected && !needsReconnect && !status.hasActivityScope;
  const hint = !status.connected
    ? "Connect Google Health to read sleep, heart rate, HRV, SpO2, respiratory rate, skin temperature and VO2 max (read-only)"
    : needsReconnect
      ? `Reconnect needed: ${last?.message ?? "the grant lacks sleep data"}`
      : [
          needsActivity ? "Reconnect Google to add VO2 max; everything else keeps syncing" : null,
          `Nights read through ${status.syncedTo ?? "-"}. Last sync ${status.lastSyncAt ? new Date(status.lastSyncAt).toLocaleString() : "never"}${last ? `: ${googleSummary(last)}` : ""}. Syncs daily.`,
          last?.warnings.length ? `${last.warnings.length} warning(s): ${last.warnings.slice(0, 3).join("; ")}` : null,
        ]
          .filter(Boolean)
          .join(" ");

  return (
    <>
      <Button size="sm" variant={!status.connected || needsReconnect || needsActivity ? "default" : "outline"} asChild title={hint}>
        <a href="/api/google/connect">
          {!status.connected
            ? "Connect Google Health"
            : needsReconnect
              ? "Reconnect Google Health"
              : needsActivity
                ? "Reconnect Google to add VO2 max"
                : "Google Health"}
        </a>
      </Button>
      {status.connected && !needsReconnect && (
        <Button size="sm" variant="outline" onClick={sync} disabled={running} title={hint}>
          <RefreshCw className={`h-4 w-4 ${running ? "animate-spin" : ""}`} />
          {running ? "Syncing..." : "Sync"}
        </Button>
      )}
    </>
  );
}

function useMyAir(status: MyAirSyncStatus) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
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
      if (r.error) toast.error(myAirSummary(r));
      else toast.success(myAirSummary(r));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setRunning(false);
    }
  }, [router]);

  return { router, running, setRunning, sync, last, needsCode };
}

function MyAirButtons({ status }: { status: MyAirSyncStatus }) {
  const { router, running, setRunning, sync, last, needsCode } = useMyAir(status);
  if (!status.configured) return null;

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

  const hint = !status.lastSyncAt
    ? "Not synced yet. Syncing reads every CPAP night myAir has (usage, AHI, leak, mask on/off, score)."
    : `${status.backfillDone ? "History complete" : `History read back to ${status.backfillFrom?.slice(0, 7) ?? "-"}`}; latest night ${last?.latest ?? "-"}. Last sync ${new Date(status.lastSyncAt).toLocaleString()}${last ? `: ${myAirSummary(last)}` : ""}. Syncs daily.`;

  return (
    <>
      {needsCode && (
        <Button size="sm" variant="outline" onClick={sendCode} disabled={running}>
          {status.codeSent ? "Resend myAir code" : "Send myAir code"}
        </Button>
      )}
      <Button size="sm" variant="outline" onClick={sync} disabled={running} title={hint}>
        <RefreshCw className={`h-4 w-4 ${running ? "animate-spin" : ""}`} />
        {running ? "Syncing..." : "ResMed myAir"}
      </Button>
    </>
  );
}

function MyAirCodeForm({ status }: { status: MyAirSyncStatus }) {
  const { running, setRunning, sync } = useMyAir(status);
  const [code, setCode] = useState("");
  if (!status.configured || !status.codeSent) return null;

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
    <form
      className="flex max-w-xs gap-2"
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
  );
}
