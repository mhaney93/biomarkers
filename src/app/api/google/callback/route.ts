import { NextResponse, type NextRequest } from "next/server";
import { getExpectedToken, isAuthed } from "@/lib/auth";
import { checkState, exchangeCode } from "@/lib/google";
import { saveGoogleTokens, storedRefreshToken } from "@/lib/sleep-sync";

const HOME = "/";

// Google redirects here after consent with ?code=&state=. The refresh token is stored
// server-side; the home page then runs the first sync (the backfill).
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams;
  const back = (params: Record<string, string>) =>
    NextResponse.redirect(new URL(`${HOME}?${new URLSearchParams(params)}`, request.url));
  if (q.get("error")) return back({ google: "error", reason: q.get("error")! });
  if (!(await isAuthed())) return back({ google: "error", reason: "Unlock editing first" });
  if (!checkState(await getExpectedToken(), q.get("state"))) {
    return back({ google: "error", reason: "Bad or expired state; try connecting again" });
  }
  const code = q.get("code");
  if (!code) return back({ google: "error", reason: "Google sent no code" });
  try {
    const tok = await exchangeCode(code, request.nextUrl.origin);
    const refreshToken = tok.refresh_token ?? (await storedRefreshToken());
    if (!refreshToken) {
      return back({
        google: "error",
        reason: "Google sent no refresh token; remove the app at myaccount.google.com/permissions and connect again",
      });
    }
    await saveGoogleTokens(refreshToken, tok.scope ?? null);
    return back({ google: "connected" });
  } catch (e) {
    return back({ google: "error", reason: (e as Error).message });
  }
}
