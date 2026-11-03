// The myAir client against a stand-in for ResMed's Okta and GraphQL endpoints (myair-fixture.ts).
import assert from "node:assert/strict";
import { test } from "vitest";
import { MyAirAuthError, MyAirStaleTokenError, REGIONS, jwtPayload, myAirAuth, myAirClient, regionConfig } from "@/lib/myair";
import { fakeJwt, fakeMyAir, nightlyRecords } from "@/lib/myair-fixture";

const NA = REGIONS.NA;

test("regionConfig maps US/NA (default) and EU", () => {
  assert.equal(regionConfig(undefined).code, "NA");
  assert.equal(regionConfig("us").code, "NA");
  assert.equal(regionConfig("NA").code, "NA");
  assert.equal(regionConfig(" eu ").code, "EU");
  assert.throws(() => regionConfig("APAC"), /Unsupported MYAIR_REGION/);
});

test("login: device cookie, password authn, PKCE code exchange, tokens", async () => {
  const f = fakeMyAir();
  const r = await myAirAuth(NA, f.fetchImpl).login("me@example.com", "hunter2", null);
  assert.equal(r.status, "SUCCESS");
  if (r.status !== "SUCCESS") return;
  assert.equal(r.tokens.accessToken, "access-1");
  assert.equal(jwtPayload(r.tokens.idToken).myAirCountryId, "US");
  assert.ok(r.tokens.expiresAt > Date.now() + 3000e3 && r.tokens.expiresAt <= Date.now() + 3600e3);
  assert.equal(r.deviceToken, "dt-new");

  const [dt, authn, authorize, token] = f.calls;
  assert.equal(dt.url, `https://${NA.oktaUrl}/oauth2/${NA.authServerId}/v1/authorize`);
  assert.deepEqual(JSON.parse(authn.body), { username: "me@example.com", password: "hunter2" });
  assert.equal(authn.cookie, "DT=dt-new");
  const q = new URL(authorize.url).searchParams;
  assert.equal(q.get("client_id"), NA.clientId);
  assert.equal(q.get("prompt"), "none");
  assert.equal(q.get("code_challenge_method"), "S256");
  assert.equal(q.get("sessionToken"), "session-1");
  assert.equal(new URLSearchParams(token.body).get("grant_type"), "authorization_code");
  assert.match(token.cookie ?? "", /DT=dt-new; sid=sid-1/);
});

test("login reuses a stored device token instead of fetching one", async () => {
  const f = fakeMyAir();
  await myAirAuth(NA, f.fetchImpl).login("me@example.com", "hunter2", "dt-old");
  assert.ok(f.calls[0].url.endsWith("/api/v1/authn"));
  assert.equal(f.calls[0].cookie, "DT=dt-old");
});

test("a wrong password is an auth error that does not echo the password", async () => {
  const f = fakeMyAir();
  const err = await myAirAuth(NA, f.fetchImpl)
    .login("me@example.com", "wrong-pass", null)
    .catch((e) => e);
  assert.ok(err instanceof MyAirAuthError);
  assert.match(err.message, /Authentication failed/);
  assert.doesNotMatch(err.message, /wrong-pass/);
});

test("emailed code: MFA_REQUIRED, send, verify, then the remembered device skips it", async () => {
  const f = fakeMyAir({ mfa: true });
  const auth = myAirAuth(NA, f.fetchImpl);
  const r = await auth.login("me@example.com", "hunter2", null);
  assert.equal(r.status, "MFA_REQUIRED");
  if (r.status !== "MFA_REQUIRED") return;
  assert.equal(r.stateToken, "state-1");
  assert.equal(r.verifyUrl, `${f.factorUrl}?rememberDevice=true`);

  await auth.sendCode(r.stateToken, r.verifyUrl, r.deviceToken);
  assert.deepEqual(f.emailed, ["123456"]);
  await assert.rejects(auth.verifyCode(r.stateToken, r.verifyUrl, "000000", r.deviceToken), MyAirAuthError);
  const ok = await auth.verifyCode(r.stateToken, r.verifyUrl, "123456", r.deviceToken);
  assert.equal(ok.tokens.accessToken, "access-1");
  assert.equal(ok.deviceToken, "dt-remembered");

  const again = await myAirAuth(NA, f.fetchImpl).login("me@example.com", "hunter2", ok.deviceToken);
  assert.equal(again.status, "SUCCESS");
});

const tokens = (accessToken = "access-1") => ({ accessToken, idToken: fakeJwt({ myAirCountryId: "US" }), expiresAt: Date.now() + 3600e3 });

test("sleepRecords sends the AppSync headers and date range and returns the items", async () => {
  const f = fakeMyAir({ records: nightlyRecords("2026-10-01", "2026-10-31") });
  const records = await myAirClient(NA, tokens(), f.fetchImpl).sleepRecords("2026-10-05", "2026-10-07");
  assert.deepEqual(records.map((r) => r.startDate), ["2026-10-05", "2026-10-06", "2026-10-07"]);
  assert.equal(records[0].totalUsage, 420);
  const [call] = f.calls;
  assert.equal(call.headers["x-api-key"], NA.apiKey);
  assert.equal(call.headers.authorization, "Bearer access-1");
  assert.equal(call.headers.rmdcountry, "US");
  assert.equal(call.headers.rmdproduct, "myAir");
  assert.match(JSON.parse(call.body).query, /sleepRecords\(startMonth: "2026-10-05", endMonth: "2026-10-07"\)/);
});

test("sleepRecords maps myAir errors", async () => {
  const stale = myAirClient(NA, tokens("old"), fakeMyAir({ rejectTokens: ["old"] }).fetchImpl);
  await assert.rejects(stale.sleepRecords("2026-10-01", "2026-10-31"), MyAirStaleTokenError);

  const onboarding = (async () =>
    Response.json({ errors: [{ errorInfo: { errorType: "badRequest", errorCode: "onboardingFlowInProgress" } }] })) as typeof fetch;
  await assert.rejects(myAirClient(NA, tokens(), onboarding).sleepRecords("2026-10-01", "2026-10-31"), /not set up/);

  const failing = fakeMyAir({ failMonths: ["2026-10-01"] }).fetchImpl;
  await assert.rejects(myAirClient(NA, tokens(), failing).sleepRecords("2026-10-01", "2026-10-31"), /Internal failure/);
  assert.throws(() => myAirClient(NA, { ...tokens(), idToken: fakeJwt({}) }), /myAirCountryId/);
});
