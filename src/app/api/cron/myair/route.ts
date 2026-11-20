import { type NextRequest } from "next/server";
import { runMyAirSync } from "@/lib/myair-sync";

export const maxDuration = 60;

// Daily Vercel cron (vercel.json) for the myAir CPAP sync. Vercel sends
// `Authorization: Bearer $CRON_SECRET`; anything else is refused.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const result = await runMyAirSync({ existingOnly: true });
  const idle = result.error === "not-configured" || result.error === "not-connected";
  return Response.json(result, { status: result.error && !idle ? 500 : 200 });
}
