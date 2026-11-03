import { type NextRequest } from "next/server";
import { runSleepSync } from "@/lib/sleep-sync";

export const maxDuration = 60;

// Daily Vercel cron (vercel.json). Vercel sends `Authorization: Bearer $CRON_SECRET`; anything
// else is refused, so the public site can't trigger syncs.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const result = await runSleepSync();
  return Response.json(result, { status: result.error && result.error !== "not-connected" ? 500 : 200 });
}
