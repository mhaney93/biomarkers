// Google OAuth and the Google Health API (v4) client for the sleep sync. Read-only scopes only.
// Client credentials come from env: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET (and optionally
// GOOGLE_REDIRECT_URI to pin the callback URL).
import crypto from "node:crypto";
import type { DailyHrvPoint, DailyRestingHeartRatePoint, SleepDataPoint } from "./sleep";

const API = "https://health.googleapis.com/v4/users/me/dataTypes";

export const SLEEP_SCOPE = "https://www.googleapis.com/auth/googlehealth.sleep.readonly";
export const METRICS_SCOPE = "https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly";
export const SCOPES = [SLEEP_SCOPE, METRICS_SCOPE];

// Google no longer accepts the stored grant: the owner has to connect again.
export class ReconnectError extends Error {}

export const hasScope = (granted: string | null, scope: string) => (granted ?? "").split(" ").includes(scope);

export function googleConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function redirectUri(origin: string) {
  return process.env.GOOGLE_REDIRECT_URI || `${origin}/api/google/callback`;
}

// OAuth state = timestamp.nonce.hmac, keyed by `key` (derived from the app password), so the
// callback can verify it without storing anything.
export function makeState(key: string, now = Date.now()) {
  const payload = `${now}.${crypto.randomBytes(8).toString("hex")}`;
  const mac = crypto.createHmac("sha256", key).update(payload).digest("hex");
  return `${payload}.${mac}`;
}

export function checkState(key: string, state: string | null, now = Date.now()) {
  const [ts, nonce, mac] = String(state ?? "").split(".");
  if (!ts || !nonce || !mac) return false;
  const expected = crypto.createHmac("sha256", key).update(`${ts}.${nonce}`).digest("hex");
  if (mac.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return false;
  const age = now - Number(ts);
  return age >= 0 && age < 10 * 60 * 1000;
}

export function authUrl(origin: string, state: string) {
  return (
    "https://accounts.google.com/o/oauth2/v2/auth?" +
    new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      redirect_uri: redirectUri(origin),
      response_type: "code",
      access_type: "offline",
      prompt: "consent",
      scope: SCOPES.join(" "),
      state,
    })
  );
}

export type TokenResponse = { access_token: string; refresh_token?: string; scope?: string; expires_in?: number };

async function tokenRequest(params: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      ...params,
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (body.error === "invalid_grant") throw new ReconnectError("Google access expired or was revoked");
  if (!res.ok) throw new Error(`Google token endpoint ${res.status}: ${body.error ?? "unknown error"}`);
  return body;
}

export const exchangeCode = (code: string, origin: string) =>
  tokenRequest({ code, redirect_uri: redirectUri(origin), grant_type: "authorization_code" });

export const refreshAccessToken = (refreshToken: string) =>
  tokenRequest({ refresh_token: refreshToken, grant_type: "refresh_token" });

export type HealthClient = {
  sleep(from: string, to: string): Promise<SleepDataPoint[]>;
  dailyRestingHeartRate(from: string, to: string): Promise<DailyRestingHeartRatePoint[]>;
  dailyHrv(from: string, to: string): Promise<DailyHrvPoint[]>;
};

export function healthClient(accessToken: string, fetchImpl: typeof fetch = fetch): HealthClient {
  async function list<T>(dataType: string, filter: string, pageSize: number): Promise<T[]> {
    const points: T[] = [];
    let pageToken = "";
    do {
      const q = new URLSearchParams({ filter, pageSize: String(pageSize) });
      if (pageToken) q.set("pageToken", pageToken);
      const res = await fetchImpl(`${API}/${dataType}/dataPoints?${q}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.status === 401) throw new ReconnectError("Google rejected the access token");
      if (!res.ok) throw new Error(`Google Health ${dataType} ${res.status}: ${(await res.text()).slice(0, 300)}`);
      const body = await res.json();
      points.push(...(body.dataPoints ?? []));
      pageToken = body.nextPageToken ?? "";
    } while (pageToken);
    return points;
  }

  return {
    // Sessions whose local (civil) end - the wake-up - falls on dates in [from, to). Sleep can only
    // be filtered on its end and allows at most 25 per page.
    sleep: (from, to) =>
      list("sleep", `sleep.interval.civil_end_time >= "${from}" AND sleep.interval.civil_end_time < "${to}"`, 25),
    dailyRestingHeartRate: (from, to) =>
      list(
        "daily-resting-heart-rate",
        `daily_resting_heart_rate.date >= "${from}" AND daily_resting_heart_rate.date < "${to}"`,
        1000,
      ),
    dailyHrv: (from, to) =>
      list(
        "daily-heart-rate-variability",
        `daily_heart_rate_variability.date >= "${from}" AND daily_heart_rate_variability.date < "${to}"`,
        1000,
      ),
  };
}
