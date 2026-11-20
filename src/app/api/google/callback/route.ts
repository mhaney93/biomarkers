import { NextResponse, type NextRequest } from "next/server";
import { isAuthed, oauthStateKey } from "@/lib/auth";
import { checkState, exchangeCode } from "@/lib/google";
import type { GoogleErrorCode } from "@/lib/google-errors";
import { saveGoogleTokens, storedRefreshToken } from "@/lib/sleep-sync";

const HOME = "/";

// Google redirects here after consent with ?code=&state=. The refresh token is stored
// server-side; the home page then runs the first sync (the backfill).
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams;
  const back = (params: { google: "connected" } | { google: "error"; reason: GoogleErrorCode }) =>
    NextResponse.redirect(new URL(`${HOME}?${new URLSearchParams(params)}`, request.url));
  if (q.get("error")) return back({ google: "error", reason: "denied" });
  if (!(await isAuthed())) return back({ google: "error", reason: "locked" });
  if (!checkState(oauthStateKey(), q.get("state"))) {
    return back({ google: "error", reason: "state" });
  }
  const code = q.get("code");
  if (!code) return back({ google: "error", reason: "no-code" });
  try {
    const tok = await exchangeCode(code, request.nextUrl.origin);
    const refreshToken = tok.refresh_token ?? (await storedRefreshToken());
    if (!refreshToken) {
      return back({ google: "error", reason: "no-refresh" });
    }
    await saveGoogleTokens(refreshToken, tok.scope ?? null);
    return back({ google: "connected" });
  } catch (e) {
    console.error("Google connect failed:", (e as Error).message);
    return back({ google: "error", reason: "exchange" });
  }
}
