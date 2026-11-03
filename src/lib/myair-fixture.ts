// A stand-in for ResMed's Okta and myAir GraphQL endpoints, for tests. Responses follow the shapes
// recorded by the reference Home Assistant integration (resmed_myair_sensors tests and its
// scripts/graphql_schema.json). Not imported by the app.
import crypto from "node:crypto";
import { REGIONS, type MyAirSleepRecord } from "@/lib/myair";

const NA = REGIONS.NA;
const OKTA = `https://${NA.oktaUrl}`;
const OAUTH = `${OKTA}/oauth2/${NA.authServerId}/v1`;
const FACTOR = `${OKTA}/api/v1/authn/factors/emf123/verify`;

const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
export const fakeJwt = (claims: object) => `${b64({ alg: "RS256" })}.${b64(claims)}.sig`;

export type FakeCall = { method: string; url: string; cookie: string | null; body: string; headers: Record<string, string> };

export type FakeMyAirOptions = {
  records?: MyAirSleepRecord[];
  // Ask for an emailed code unless the request carries the remembered-device cookie.
  mfa?: boolean;
  password?: string;
  // Access tokens the GraphQL API rejects as unauthorized.
  rejectTokens?: string[];
  // Months (YYYY-MM-01) whose query fails with a server error.
  failMonths?: string[];
};

export function fakeMyAir(opts: FakeMyAirOptions = {}) {
  const calls: FakeCall[] = [];
  const pkce = new Map<string, string>();
  let issued = 0;
  const emailed: string[] = [];
  const reply = (status: number, body: unknown, headers: Record<string, string> = {}) =>
    new Response(body == null ? null : JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });

  const fetchImpl = (async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = String(input);
    const headers = Object.fromEntries(Object.entries((init.headers as Record<string, string>) ?? {}).map(([k, v]) => [k.toLowerCase(), v]));
    const body = init.body == null ? "" : String(init.body);
    const method = init.method ?? "GET";
    calls.push({ method, url, cookie: headers.cookie ?? null, body, headers });
    const remembered = (headers.cookie ?? "").includes("DT=dt-remembered");

    if (url === `${OAUTH}/authorize`) return reply(400, { error: "invalid_request" }, { "set-cookie": "DT=dt-new; Path=/; Secure" });
    if (url === `${OKTA}/api/v1/authn`) {
      const { password } = JSON.parse(body);
      if (password !== (opts.password ?? "hunter2"))
        return reply(401, { errorCode: "E0000004", errorSummary: "Authentication failed", errorCauses: [] });
      if (opts.mfa && !remembered)
        return reply(200, {
          status: "MFA_REQUIRED",
          stateToken: "state-1",
          _embedded: { factors: [{ id: "emf123", factorType: "email", _links: { verify: { href: FACTOR } } }] },
        });
      return reply(200, { status: "SUCCESS", sessionToken: "session-1" });
    }
    if (url.startsWith(`${FACTOR}?`)) {
      const { passCode, stateToken } = JSON.parse(body);
      if (stateToken !== "state-1") return reply(403, { errorCode: "E0000011", errorSummary: "Invalid token provided" });
      if (passCode === "") {
        emailed.push("123456");
        return reply(200, { status: "MFA_CHALLENGE", stateToken });
      }
      if (passCode !== "123456") return reply(403, { errorCode: "E0000068", errorSummary: "Invalid Passcode/Answer" });
      return reply(200, { status: "SUCCESS", sessionToken: "session-2" }, { "set-cookie": "DT=dt-remembered; Path=/; Secure; HttpOnly" });
    }
    if (url.startsWith(`${OAUTH}/authorize?`)) {
      const q = new URL(url).searchParams;
      if (!q.get("sessionToken")?.startsWith("session-")) return reply(302, null, { location: `${NA.redirectUrl}#error=login_required` });
      const code = `code-${pkce.size + 1}`;
      pkce.set(code, q.get("code_challenge")!);
      return reply(302, null, { location: `${NA.redirectUrl}#code=${code}&state=${q.get("state")}`, "set-cookie": "sid=sid-1; Path=/" });
    }
    if (url === `${OAUTH}/token`) {
      const q = new URLSearchParams(body);
      const challenge = crypto.createHash("sha256").update(q.get("code_verifier") ?? "").digest("base64url");
      if (pkce.get(q.get("code") ?? "") !== challenge) return reply(400, { error: "invalid_grant", error_description: "PKCE verification failed." });
      issued++;
      return reply(200, {
        token_type: "Bearer",
        expires_in: 3600,
        scope: "openid profile email",
        access_token: `access-${issued}`,
        id_token: fakeJwt({ sub: "00u1", myAirCountryId: "US" }),
      });
    }
    if (url === NA.graphqlUrl) {
      const token = (headers.authorization ?? "").replace("Bearer ", "");
      if (opts.rejectTokens?.includes(token))
        return reply(200, { data: { getPatientWrapper: null }, errors: [{ errorInfo: { errorType: "unauthorized", errorCode: "tokenExpired" } }] });
      const { query } = JSON.parse(body);
      const [, from, to] = /startMonth: "([\d-]+)", endMonth: "([\d-]+)"/.exec(query) ?? [];
      if (opts.failMonths?.includes(from)) return reply(500, { errors: [{ message: "Internal failure" }] });
      const items = (opts.records ?? []).filter((r) => r.startDate >= from && r.startDate <= to).map((r) => ({ ...r, __typename: "SleepRecord" }));
      return reply(200, { data: { getPatientWrapper: { sleepRecords: { items, __typename: "SleepRecordConnection" }, __typename: "PatientWrapper" } } });
    }
    return reply(404, { error: `unexpected ${method} ${url}` });
  }) as typeof fetch;

  return { fetchImpl, calls, emailed, factorUrl: FACTOR };
}

// One record per night from `from` to `to` (inclusive), shaped like myAir's, with `override(date)`.
export function nightlyRecords(from: string, to: string, override: (date: string) => Partial<MyAirSleepRecord> = () => ({})) {
  const out: MyAirSleepRecord[] = [];
  for (let t = Date.parse(from); t <= Date.parse(to); t += 86400e3) {
    const startDate = new Date(t).toISOString().slice(0, 10);
    out.push({
      startDate,
      totalUsage: 420,
      sleepScore: 90,
      usageScore: 70,
      ahiScore: 5,
      maskScore: 5,
      leakScore: 20,
      ahi: 1.2,
      maskPairCount: 2,
      leakPercentile: 6,
      ...override(startDate),
    });
  }
  return out;
}
