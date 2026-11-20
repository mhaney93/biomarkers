"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Unplug } from "lucide-react";
import { toast } from "sonner";
import {
  disconnectGoogleNow,
  disconnectMyAirNow,
  sendMyAirCodeNow,
  syncMyAirNow,
  syncSleepNow,
  verifyMyAirCodeNow,
} from "@/app/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  connected: boolean;
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
      {(!status.connected || needsReconnect || needsActivity) && (
        <Button size="sm" variant="default" asChild title={hint}>
          <a href="/api/google/connect">
            {!status.connected
              ? "Connect Google Health"
              : needsReconnect
                ? "Reconnect Google Health"
                : "Reconnect Google to add VO2 max"}
          </a>
        </Button>
      )}
      {status.connected && !needsReconnect && (
        <Button size="sm" variant="outline" onClick={sync} disabled={running} title={hint}>
          <RefreshCw className={`h-4 w-4 ${running ? "animate-spin" : ""}`} />
          {running ? "Syncing..." : "Sync Google Fitbit Edge"}
        </Button>
      )}
      {status.connected && (
        <DisconnectButton
          service="Google Health"
          action={disconnectGoogleNow}
          disabled={running}
          details="This revokes the app's access at Google and deletes the stored refresh token. The daily sync stops until you connect again."
          purgeLabel="Also delete the nightly sleep and daily heart-rate / HRV / SpO2 rows synced from Google"
          notRevoked="Disconnected here, but Google did not confirm the revoke: remove the app at myaccount.google.com/permissions"
        />
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
        {running ? "Syncing..." : status.connected ? "Sync ResMed myAir" : "Connect ResMed myAir"}
      </Button>
      {status.connected && (
        <DisconnectButton
          service="ResMed myAir"
          action={disconnectMyAirNow}
          disabled={running}
          details="This revokes the current myAir access token and deletes the stored tokens and remembered-device cookie. The daily sync stops until you sync again; to retire it for good, also remove MYAIR_USERNAME and MYAIR_PASSWORD from the Vercel env."
          purgeLabel="Also delete the nightly CPAP rows synced from myAir"
          notRevoked="Disconnected here; myAir did not confirm the token revoke (it expires within an hour)"
        />
      )}
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

// Owner-only (the page renders these buttons only when unlocked; the actions call requireAuth too).
// Published monthly readings are kept either way; they are ordinary readings.
function DisconnectButton({
  service,
  action,
  disabled,
  details,
  purgeLabel,
  notRevoked,
}: {
  service: string;
  action: (purge: boolean) => Promise<{ revoked?: boolean; error?: string }>;
  disabled: boolean;
  details: string;
  purgeLabel: string;
  notRevoked: string;
}) {
  const router = useRouter();
  const [purge, setPurge] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <AlertDialog onOpenChange={(open) => !open && setPurge(false)}>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="ghost" disabled={disabled || pending} title={`Disconnect ${service}`}>
          <Unplug className="h-4 w-4" />
          Disconnect
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Disconnect {service}?</AlertDialogTitle>
          <AlertDialogDescription>
            {details} Monthly readings already published stay.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-0.5" checked={purge} onChange={(e) => setPurge(e.target.checked)} />
          {purgeLabel}
        </label>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                const r = await action(purge);
                router.refresh();
                if (r.error) toast.error(r.error);
                else if (!r.revoked) toast.warning(notRevoked);
                else toast.success(`${service} disconnected${purge ? "; nightly data deleted" : ""}`);
              });
            }}
          >
            Disconnect
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
