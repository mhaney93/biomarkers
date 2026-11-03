// An unofficial ResMed myAir client: ResMed has no public API, so this signs in the way the myAir web
// app does (Okta username/password, then an OAuth code with PKCE) and reads nightly CPAP records
// from its AppSync GraphQL API. Ported from the Home Assistant "resmed_myair" integration
// (github.com/prestomation/resmed_myair_sensors); ResMed can change any of it without notice.
// Credentials come from env (MYAIR_USERNAME, MYAIR_PASSWORD) and never appear in errors, logs or
// the browser.
import crypto from "node:crypto";

export type MyAirRegion = {
  product: string;
  oktaUrl: string;
  authServerId: string;
  clientId: string;
  apiKey: string;
  graphqlUrl: string;
  redirectUrl: string;
};

// Public client identifiers the US/North America myAir web app itself sends (from the reference integration).
export const MYAIR_NA: MyAirRegion = {
  product: "myAir",
  oktaUrl: "resmed-ext-1.okta.com",
  authServerId: "aus4ccsxvnidQgLmA297",
  clientId: "0oa4ccq1v413ypROi297",
  apiKey: "da2-cenztfjrezhwphdqtwtbpqvzui",
  graphqlUrl: "https://graphql.myair-prd.dht.live/graphql",
  redirectUrl: "https://myair.resmed.com",
};

export function myAirConfigured() {
  return Boolean(process.env.MYAIR_USERNAME && process.env.MYAIR_PASSWORD);
}

export function myAirCredentials() {
  const username = process.env.MYAIR_USERNAME;
  const password = process.env.MYAIR_PASSWORD;
  if (!username || !password) throw new MyAirAuthError("MYAIR_USERNAME / MYAIR_PASSWORD are not set");
  return { username, password };
}

// myAir rejected the login, or the account can't be used: the owner has to act.
export class MyAirAuthError extends Error {}
// The access token stopped working: sign in again.
export class MyAirStaleTokenError extends Error {}

export type MyAirTokens = { accessToken: string; idToken: string; expiresAt: number };

export type LoginResult =
  | { status: "SUCCESS"; tokens: MyAirTokens; deviceToken: string | null }
  | { status: "MFA_REQUIRED"; stateToken: string; verifyUrl: string; deviceToken: string | null };

// One nightly record as the GraphQL API sends it (startDate is the night's local date).
export type MyAirSleepRecord = {
  startDate: string;
  totalUsage?: number | null;
  sleepScore?: number | null;
  usageScore?: number | null;
  ahiScore?: number | null;
  maskScore?: number | null;
  leakScore?: number | null;
  ahi?: number | null;
  maskPairCount?: number | null;
  leakPercentile?: number | null;
};

export type MyAirClient = {
  // Records for nights from `from` to `to` (YYYY-MM-DD, both inclusive).
  sleepRecords(from: string, to: string): Promise<MyAirSleepRecord[]>;
};

const JSON_HEADERS = { "Content-Type": "application/json", Accept: "application/json" };
const FORM_HEADERS = { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" };

async function json(res: Response): Promise<Record<string, unknown>> {
  return (await res.json().catch(() => ({}))) as Record<string, unknown>;
}

// Okta's error body: { errorCode, errorSummary }. Never echo the request (it holds the password).
function oktaError(step: string, res: Response, body: Record<string, unknown>) {
  const summary = String(body.errorSummary ?? body.error_description ?? body.error ?? "unknown error").slice(0, 200);
  if (res.status === 401 || res.status === 403 || body.errorCode === "E0000004")
    return new MyAirAuthError(`myAir sign-in failed (${step}): ${summary}`);
  return new Error(`myAir ${step} ${res.status}: ${summary}`);
}

// The Okta sign-in. `deviceToken` is Okta's remembered-device cookie (DT): with it, an account that
// uses emailed codes is not asked again. It is read from and written back to the caller.
export function myAirAuth(region: MyAirRegion, fetchImpl: typeof fetch = fetch) {
  const base = `https://${region.oktaUrl}`;
  const oauth = `${base}/oauth2/${region.authServerId}/v1`;
  const cookies: Record<string, string> = {};

  const cookieHeader = () =>
    Object.entries(cookies)
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
  const remember = (res: Response) => {
    for (const c of res.headers.getSetCookie?.() ?? []) {
      const [pair] = c.split(";");
      const i = pair.indexOf("=");
      const name = pair.slice(0, i).trim().toLowerCase();
      const value = pair.slice(i + 1).trim();
      if ((name === "dt" || name === "sid") && value) cookies[name === "dt" ? "DT" : "sid"] = value;
    }
  };
  const call = async (url: string, init: RequestInit = {}) => {
    const res = await fetchImpl(url, {
      ...init,
      redirect: "manual",
      headers: { ...(init.headers as Record<string, string>), ...(cookieHeader() ? { Cookie: cookieHeader() } : {}) },
    });
    remember(res);
    return res;
  };

  // Okta hands out the DT cookie on any authorize request (a 400 is expected here).
  async function ensureDeviceToken(deviceToken: string | null) {
    if (deviceToken) cookies.DT = deviceToken;
    else await call(`${oauth}/authorize`, { headers: JSON_HEADERS });
  }

  // sessionToken -> authorization code (PKCE, prompt=none) -> access and id tokens.
  async function tokens(sessionToken: string, now = Date.now()): Promise<MyAirTokens> {
    const verifier = crypto.randomBytes(40).toString("base64url").replace(/[^a-zA-Z0-9]/g, "");
    const challenge = crypto.createHash("sha256").update(verifier).digest("base64url");
    const q = new URLSearchParams({
      client_id: region.clientId,
      code_challenge: challenge,
      code_challenge_method: "S256",
      prompt: "none",
      redirect_uri: region.redirectUrl,
      response_mode: "fragment",
      response_type: "code",
      sessionToken,
      scope: "openid profile email",
      state: crypto.randomBytes(8).toString("hex"),
    });
    const res = await call(`${oauth}/authorize?${q}`, { headers: JSON_HEADERS });
    const location = res.headers.get("location") ?? "";
    const fragment = new URLSearchParams(location.split("#")[1] ?? "");
    const code = fragment.get("code");
    if (!code) {
      const why = fragment.get("error_description") ?? fragment.get("error") ?? `status ${res.status}`;
      throw new Error(`myAir authorize: no authorization code (${why.slice(0, 200)})`);
    }
    const tokenRes = await call(`${oauth}/token`, {
      method: "POST",
      headers: FORM_HEADERS,
      body: new URLSearchParams({
        client_id: region.clientId,
        redirect_uri: region.redirectUrl,
        grant_type: "authorization_code",
        code_verifier: verifier,
        code,
      }),
    });
    const body = await json(tokenRes);
    if (!tokenRes.ok) throw oktaError("token", tokenRes, body);
    if (typeof body.access_token !== "string" || typeof body.id_token !== "string")
      throw new Error("myAir token: response is missing access_token or id_token");
    const ttl = Number(body.expires_in ?? 3600);
    return { accessToken: body.access_token, idToken: body.id_token, expiresAt: now + Math.max(ttl - 120, 60) * 1000 };
  }

  // The verify link for the emailed-code factor, from the authn response.
  function verifyUrl(body: Record<string, unknown>) {
    const factors = ((body._embedded as Record<string, unknown> | undefined)?.factors ?? []) as Record<string, unknown>[];
    const factor = factors.find((f) => f.factorType === "email") ?? factors[0];
    const href = ((factor?._links as Record<string, { href?: string }> | undefined)?.verify?.href) ?? null;
    if (href) return `${href}?rememberDevice=true`;
    if (typeof factor?.id === "string") return `${base}/api/v1/authn/factors/${factor.id}/verify?rememberDevice=true`;
    throw new Error("myAir asked for a code but named no email factor");
  }

  async function finishAuthn(step: string, res: Response): Promise<LoginResult> {
    const body = await json(res);
    if (!res.ok) throw oktaError(step, res, body);
    if (body.status === "SUCCESS" && typeof body.sessionToken === "string")
      return { status: "SUCCESS", tokens: await tokens(body.sessionToken), deviceToken: cookies.DT ?? null };
    if (body.status === "MFA_REQUIRED" && typeof body.stateToken === "string")
      return { status: "MFA_REQUIRED", stateToken: body.stateToken, verifyUrl: verifyUrl(body), deviceToken: cookies.DT ?? null };
    if (body.status === "MFA_CHALLENGE")
      throw new MyAirAuthError(`myAir sign-in failed (${step}): the code was not accepted`);
    throw new MyAirAuthError(`myAir sign-in stopped at status ${String(body.status ?? "unknown")} (${step})`);
  }

  return {
    // Username and password -> tokens, or a request for an emailed code.
    async login(username: string, password: string, deviceToken: string | null): Promise<LoginResult> {
      await ensureDeviceToken(deviceToken);
      const res = await call(`${base}/api/v1/authn`, {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({ username, password }),
      });
      return finishAuthn("authn", res);
    },
    // Ask Okta to email the code for a pending MFA_REQUIRED sign-in.
    async sendCode(stateToken: string, url: string, deviceToken: string | null) {
      await ensureDeviceToken(deviceToken);
      const res = await call(url, { method: "POST", headers: JSON_HEADERS, body: JSON.stringify({ stateToken, passCode: "" }) });
      const body = await json(res);
      if (!res.ok) throw oktaError("send code", res, body);
      return { deviceToken: cookies.DT ?? null };
    },
    // The emailed code -> tokens. The device is remembered, so later sign-ins skip the code.
    async verifyCode(stateToken: string, url: string, code: string, deviceToken: string | null) {
      await ensureDeviceToken(deviceToken);
      const res = await call(url, { method: "POST", headers: JSON_HEADERS, body: JSON.stringify({ stateToken, passCode: code }) });
      const result = await finishAuthn("verify code", res);
      if (result.status !== "SUCCESS") throw new MyAirAuthError("myAir did not accept the code");
      return result;
    },
  };
}

// The id token's unverified payload (only read for the account's country, which the API wants).
export function jwtPayload(token: string): Record<string, unknown> {
  try {
    return JSON.parse(Buffer.from(token.split(".")[1] ?? "", "base64url").toString("utf8"));
  } catch {
    return {};
  }
}

const RECORD_FIELDS =
  "startDate totalUsage sleepScore usageScore ahiScore maskScore leakScore ahi maskPairCount leakPercentile";

// GraphQL errors look like { errors: [{ message, errorInfo: { errorType, errorCode } }] }.
function graphqlError(status: number, body: Record<string, unknown>) {
  const first = ((body.errors as Record<string, unknown>[] | undefined) ?? [])[0];
  if (status === 401 || status === 403) return new MyAirStaleTokenError(`myAir API ${status}`);
  if (!first) return null;
  const info = first.errorInfo as { errorType?: string; errorCode?: string } | undefined;
  const what = info ? `${info.errorType}: ${info.errorCode}` : String(first.message ?? "error").slice(0, 200);
  if (info?.errorType === "unauthorized") return new MyAirStaleTokenError(`myAir API ${what}`);
  if (info?.errorType === "badRequest" && ["onboardingFlowInProgress", "equipmentNotAssigned"].includes(info.errorCode ?? ""))
    return new MyAirAuthError(`myAir account is not set up (${what}); finish setup in the myAir app`);
  return new Error(`myAir API ${what}`);
}

export function myAirClient(region: MyAirRegion, tokens: MyAirTokens, fetchImpl: typeof fetch = fetch): MyAirClient {
  const country = jwtPayload(tokens.idToken).myAirCountryId;
  if (typeof country !== "string" || !country) throw new Error("myAir id token has no myAirCountryId");
  const headers = {
    "Content-Type": "application/json",
    "x-api-key": region.apiKey,
    Authorization: `Bearer ${tokens.accessToken}`,
    rmdhandsetid: "02c1c662-c289-41fd-a9ae-196ff15b5166",
    rmdlanguage: "en",
    rmdhandsetmodel: "Chrome",
    rmdhandsetosversion: "127.0.6533.119",
    rmdproduct: region.product,
    rmdappversion: "1.0.0",
    rmdhandsetplatform: "Web",
    rmdcountry: country,
    "accept-language": "en-US,en;q=0.9",
  };

  return {
    async sleepRecords(from, to) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) throw new Error("bad date");
      const query = `query GetPatientSleepRecords { getPatientWrapper { sleepRecords(startMonth: "${from}", endMonth: "${to}") { items { ${RECORD_FIELDS} } } } }`;
      const res = await fetchImpl(region.graphqlUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({ operationName: "GetPatientSleepRecords", variables: {}, query }),
      });
      const body = await json(res);
      const err = graphqlError(res.status, body);
      if (err) throw err;
      if (!res.ok) throw new Error(`myAir API ${res.status}`);
      const items = (body.data as { getPatientWrapper?: { sleepRecords?: { items?: unknown } } } | undefined)
        ?.getPatientWrapper?.sleepRecords?.items;
      if (!Array.isArray(items)) throw new Error("myAir API returned no sleep records list");
      return items as MyAirSleepRecord[];
    },
  };
}
