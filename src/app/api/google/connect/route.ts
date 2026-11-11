import { NextResponse, type NextRequest } from "next/server";
import { getExpectedToken, isAuthed } from "@/lib/auth";
import { authUrl, googleConfigured, makeState } from "@/lib/google";

const HOME = "/";

// Starts the Google consent flow. Only an unlocked (password-cookie) session may connect.
export async function GET(request: NextRequest) {
  const back = (reason: string) =>
    NextResponse.redirect(new URL(`${HOME}?${new URLSearchParams({ google: "error", reason })}`, request.url));
  if (!(await isAuthed())) return back("Unlock editing first");
  if (!googleConfigured()) return back("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are not set");
  const state = makeState(await getExpectedToken());
  return NextResponse.redirect(authUrl(request.nextUrl.origin, state));
}
