import assert from "node:assert/strict";
import { test } from "vitest";
import { ReconnectError, SCOPES, authUrl, checkState, hasScope, healthClient, makeState } from "./google";

test("OAuth state verifies with its key and expires after 10 minutes", () => {
  const now = 1_800_000_000_000;
  const state = makeState("key", now);
  assert.equal(checkState("key", state, now + 60_000), true);
  assert.equal(checkState("other", state, now), false);
  assert.equal(checkState("key", state, now + 11 * 60_000), false);
  assert.equal(checkState("key", state.replace(/.$/, (c) => (c === "0" ? "1" : "0")), now), false);
  assert.equal(checkState("key", null, now), false);
});

test("authUrl asks for read-only sleep and health-metric scopes and a refresh token", () => {
  process.env.GOOGLE_CLIENT_ID = "client";
  delete process.env.GOOGLE_REDIRECT_URI;
  const url = new URL(authUrl("https://biomarkers-kappa.vercel.app", "s"));
  assert.equal(url.searchParams.get("redirect_uri"), "https://biomarkers-kappa.vercel.app/api/google/callback");
  assert.equal(url.searchParams.get("access_type"), "offline");
  assert.deepEqual(url.searchParams.get("scope")!.split(" "), SCOPES);
  assert.ok(SCOPES.every((s) => s.endsWith(".readonly")));
});

test("hasScope", () => {
  assert.equal(hasScope(SCOPES.join(" "), SCOPES[0]), true);
  assert.equal(hasScope(null, SCOPES[0]), false);
});

test("healthClient follows page tokens and filters sleep on its civil end", async () => {
  const urls: URL[] = [];
  const pages = [
    { dataPoints: [{ name: "a" }], nextPageToken: "p2" },
    { dataPoints: [{ name: "b" }], nextPageToken: "" },
  ];
  const fake = (async (url: string) => {
    urls.push(new URL(url));
    return Response.json(pages[urls.length - 1]);
  }) as typeof fetch;
  const points = await healthClient("tok", fake).sleep("2026-10-01", "2026-11-01");
  assert.deepEqual(
    points.map((p) => p.name),
    ["a", "b"],
  );
  assert.equal(urls[0].pathname, "/v4/users/me/dataTypes/sleep/dataPoints");
  assert.equal(
    urls[0].searchParams.get("filter"),
    'sleep.interval.civil_end_time >= "2026-10-01" AND sleep.interval.civil_end_time < "2026-11-01"',
  );
  assert.equal(urls[0].searchParams.get("pageSize"), "25");
  assert.equal(urls[1].searchParams.get("pageToken"), "p2");
});

test("healthClient turns a 401 into ReconnectError", async () => {
  const fake = (async () => new Response("no", { status: 401 })) as unknown as typeof fetch;
  await assert.rejects(healthClient("tok", fake).dailyHrv("2026-10-01", "2026-11-01"), ReconnectError);
});
