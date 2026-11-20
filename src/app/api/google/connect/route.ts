import { NextResponse, type NextRequest } from "next/server";
import { isAuthed, oauthStateKey } from "@/lib/auth";
import { authUrl, googleConfigured, makeState } from "@/lib/google";
import type { GoogleErrorCode } from "@/lib/google-errors";

const HOME = "/";

// Starts the Google consent flow. Only an unlocked (edit-session) browser may connect.
export async function GET(request: NextRequest) {
  const back = (reason: GoogleErrorCode) =>
    NextResponse.redirect(new URL(`${HOME}?${new URLSearchParams({ google: "error", reason })}`, request.url));
  if (!(await isAuthed())) return back("locked");
  if (!googleConfigured()) return back("config");
  const state = makeState(oauthStateKey());
  return NextResponse.redirect(authUrl(request.nextUrl.origin, state));
}
