// The myAir sync's database side against an in-memory Postgres (PGlite) and a stand-in for
// ResMed's endpoints (myair-fixture.ts), signing in through the real client.
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { pushSchema } from "drizzle-kit/api";
import { count, eq } from "drizzle-orm";
import { afterEach, beforeEach, test, vi } from "vitest";
import * as schema from "@/db/schema";
import { fakeMyAir, nightlyRecords } from "@/lib/myair-fixture";

let db: ReturnType<typeof drizzle<typeof schema>>;
vi.mock("@/db", () => ({ getDb: () => db }));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

const { runMyAirSync, sendMyAirCode, verifyMyAirCode, getMyAirStatus } = await import("@/lib/myair-sync");
const { biomarkers, cpapNights, myairAuth, readings } = schema;

const TODAY = "2026-11-02";

beforeEach(async () => {
  db = drizzle(new PGlite(), { schema });
  const { apply } = await pushSchema(schema, db as never);
  await apply();
  vi.stubEnv("MYAIR_USERNAME", "me@example.com");
  vi.stubEnv("MYAIR_PASSWORD", "hunter2");
});
afterEach(() => {
  vi.unstubAllEnvs();
});

// Aug 1 - Nov 1 2026, 7 h a night, except Sept 15 (machine unused).
const RECORDS = nightlyRecords("2026-08-01", "2026-11-01", (d) =>
  d === "2026-09-15" ? { totalUsage: 0, ahi: 0, sleepScore: 0, maskPairCount: 0, leakPercentile: 0 } : {},
);

async function readingsByName() {
  const rows = await db
    .select({ name: biomarkers.name, takenAt: readings.takenAt, value: readings.value })
    .from(readings)
    .innerJoin(biomarkers, eq(readings.biomarkerId, biomarkers.id));
  const out: Record<string, string[]> = {};
  for (const r of rows) (out[r.name] ??= []).push(`${r.takenAt}=${Number(r.value)}`);
  for (const k in out) out[k].sort();
  return out;
}

const nightCount = async () => (await db.select({ n: count() }).from(cpapNights))[0].n;

test("backfill reads all history, publishes completed months, then stays idempotent", async () => {
  const f = fakeMyAir({ records: RECORDS });
  const first = await runMyAirSync({ today: TODAY, fetchImpl: f.fetchImpl, budgetMs: 60_000 });
  assert.equal(first.error, undefined, first.message);
  assert.equal(first.more, false);
  assert.equal(first.backfillDone, true);
  assert.equal(first.latest, "2026-11-01");
  // Recent: the last 30 days by month, then back a month at a time until 24 empty months.
  assert.deepEqual(first.windows.slice(0, 3).map((w) => `${w.from}..${w.to}`), [
    "2026-10-03..2026-10-31",
    "2026-11-01..2026-11-02",
    "2026-10-01..2026-10-31",
  ]);
  assert.equal(first.backfillFrom, "2024-08-01");
  assert.equal(await nightCount(), RECORDS.length);

  const out = await readingsByName();
  assert.deepEqual(out["CPAP Usage (Monthly)"], ["2026-08-31=420", "2026-09-30=406", "2026-10-31=420"]);
  assert.deepEqual(out["CPAP AHI (Monthly)"], ["2026-08-31=1.2", "2026-09-30=1.2", "2026-10-31=1.2"]);
  assert.deepEqual(out["CPAP Mask Leak (Monthly)"], ["2026-08-31=6", "2026-09-30=6", "2026-10-31=6"]);
  assert.deepEqual(out["CPAP Mask On/Off (Monthly)"], ["2026-08-31=2", "2026-09-30=2", "2026-10-31=2"]);
  assert.deepEqual(out["myAir Score (Monthly)"], ["2026-08-31=90", "2026-09-30=90", "2026-10-31=90"]);

  const made = await db.select().from(biomarkers);
  assert.deepEqual(new Set(made.map((b) => b.category)), new Set(["Sleep"]));
  const byName = Object.fromEntries(made.map((b) => [b.name, b]));
  assert.equal(byName["CPAP Usage (Monthly)"].valueType, "duration");
  assert.equal(Number(byName["CPAP Usage (Monthly)"].refLow), 240);
  assert.equal(Number(byName["CPAP AHI (Monthly)"].refHigh), 5);
  assert.equal(byName["CPAP AHI (Monthly)"].unit, "events/h");
  assert.equal(Number(byName["CPAP Mask Leak (Monthly)"].refHigh), 24);
  const [sept] = await db.select({ notes: readings.notes }).from(readings).where(eq(readings.takenAt, "2026-09-30")).limit(1);
  assert.match(sept.notes ?? "", /ResMed myAir\.$/);

  // Next day: one sign-in (the stored token is reused), only recent nights reread, nothing new.
  const before = f.calls.length;
  const again = await runMyAirSync({ today: "2026-11-03", fetchImpl: f.fetchImpl });
  assert.equal(again.error, undefined);
  assert.deepEqual(again.windows.map((w) => `${w.from}..${w.to}`), ["2026-10-29..2026-10-31", "2026-11-01..2026-11-03"]);
  assert.deepEqual(again.published?.added, []);
  assert.deepEqual(again.published?.updated, []);
  assert.ok(f.calls.slice(before).every((c) => !c.url.includes("okta")), "a valid stored token needs no sign-in");
  assert.equal(await nightCount(), RECORDS.length);
  assert.equal((await db.select().from(readings)).length, 15);
});

test("a night uploaded late updates its month on a later sync", async () => {
  await runMyAirSync({ today: TODAY, fetchImpl: fakeMyAir({ records: RECORDS }).fetchImpl, budgetMs: 60_000 });
  const late = RECORDS.map((r) => (r.startDate === "2026-10-31" ? { ...r, totalUsage: 451 } : r));
  const r = await runMyAirSync({ today: TODAY, fetchImpl: fakeMyAir({ records: late }).fetchImpl });
  assert.deepEqual(r.published?.updated, ["2026-10 CPAP Usage (Monthly): 420 -> 421"]);
  assert.deepEqual((await readingsByName())["CPAP Usage (Monthly)"], ["2026-08-31=420", "2026-09-30=406", "2026-10-31=421"]);
});

test("a small time budget backfills one month per run and resumes", async () => {
  const f = fakeMyAir({ records: RECORDS });
  const r = await runMyAirSync({ today: TODAY, fetchImpl: f.fetchImpl, budgetMs: 0 });
  assert.equal(r.more, true);
  assert.equal(r.backfillFrom, "2026-10-01");
  assert.deepEqual((await readingsByName())["CPAP AHI (Monthly)"], ["2026-10-31=1.2"]);
  const next = await runMyAirSync({ today: TODAY, fetchImpl: f.fetchImpl, budgetMs: 0 });
  assert.equal(next.backfillFrom, "2026-09-01");
  assert.deepEqual((await readingsByName())["CPAP AHI (Monthly)"], ["2026-09-30=1.2", "2026-10-31=1.2"]);
});

test("a stored token myAir no longer accepts is replaced by one fresh sign-in", async () => {
  await runMyAirSync({ today: TODAY, fetchImpl: fakeMyAir({ records: RECORDS }).fetchImpl, budgetMs: 60_000 });
  await db.update(myairAuth).set({ accessToken: "stale" });
  const f = fakeMyAir({ records: RECORDS, rejectTokens: ["stale"] });
  const r = await runMyAirSync({ today: TODAY, fetchImpl: f.fetchImpl });
  assert.equal(r.error, undefined, r.message);
  assert.equal(f.calls.filter((c) => c.url.endsWith("/api/v1/authn")).length, 1);
  assert.equal((await db.select().from(myairAuth))[0].accessToken, "access-1");
});

test("an account that wants an emailed code: sync reports it, send + verify signs in for good", async () => {
  const f = fakeMyAir({ records: RECORDS, mfa: true });
  const r = await runMyAirSync({ today: TODAY, fetchImpl: f.fetchImpl, budgetMs: 60_000 });
  assert.equal(r.error, "mfa");
  assert.deepEqual(f.emailed, [], "the cron never sends codes by itself");

  assert.deepEqual(await sendMyAirCode(f.fetchImpl), { sent: true });
  assert.deepEqual(f.emailed, ["123456"]);
  assert.ok((await getMyAirStatus())?.mfaSentAt);
  await assert.rejects(verifyMyAirCode("111111", f.fetchImpl), /Invalid Passcode/);
  await verifyMyAirCode("123 456", f.fetchImpl);
  const [auth] = await db.select().from(myairAuth);
  assert.equal(auth.deviceToken, "dt-remembered");
  assert.equal(auth.mfaStateToken, null);
  assert.equal((await getMyAirStatus())?.mfaSentAt, null);

  // Later sign-ins (token expired) carry the remembered device and need no code.
  await db.update(myairAuth).set({ tokenExpiresAt: new Date(Date.now() - 1000) });
  const ok = await runMyAirSync({ today: TODAY, fetchImpl: f.fetchImpl, budgetMs: 60_000 });
  assert.equal(ok.error, undefined, ok.message);
  assert.equal(ok.backfillDone, true);
});

test("a wrong password is reported as an auth error and stored for the page", async () => {
  vi.stubEnv("MYAIR_PASSWORD", "nope");
  const r = await runMyAirSync({ today: TODAY, fetchImpl: fakeMyAir().fetchImpl });
  assert.equal(r.error, "auth");
  assert.doesNotMatch(JSON.stringify(r), /nope/);
  assert.equal((await getMyAirStatus())?.lastSync?.error, "auth");
});

test("a month myAir fails on stays in the backfill for the next run", async () => {
  const f = fakeMyAir({ records: RECORDS, failMonths: ["2026-08-01"] });
  const r = await runMyAirSync({ today: TODAY, fetchImpl: f.fetchImpl, budgetMs: 60_000 });
  assert.equal(r.error, undefined);
  assert.equal(r.more, false);
  assert.equal(r.backfillDone, false);
  assert.equal(r.backfillFrom, "2026-09-01");
  assert.match(r.warnings.join(), /backfill 2026-08: myAir API Internal failure/);
  const next = await runMyAirSync({ today: TODAY, fetchImpl: fakeMyAir({ records: RECORDS }).fetchImpl, budgetMs: 60_000 });
  assert.equal(next.backfillDone, true);
  assert.deepEqual((await readingsByName())["CPAP AHI (Monthly)"], ["2026-08-31=1.2", "2026-09-30=1.2", "2026-10-31=1.2"]);
});

test("a month with no sleep records list stalls the backfill without failing the run", async () => {
  const f = fakeMyAir({ records: RECORDS, noListMonths: ["2026-08-01"] });
  const r = await runMyAirSync({ today: TODAY, fetchImpl: f.fetchImpl, budgetMs: 60_000 });
  assert.equal(r.error, undefined);
  assert.equal(r.backfillDone, false);
  assert.equal(r.backfillFrom, "2026-09-01");
  assert.match(r.warnings.join(), /backfill 2026-08: myAir API returned no sleep records list/);
  assert.equal(f.calls.filter((c) => c.url.endsWith("/authn")).length, 1);
  assert.deepEqual((await readingsByName())["CPAP AHI (Monthly)"], ["2026-09-30=1.2", "2026-10-31=1.2"]);
});

test("without credentials the sync does nothing", async () => {
  vi.stubEnv("MYAIR_USERNAME", "");
  const r = await runMyAirSync({ today: TODAY, fetchImpl: fakeMyAir().fetchImpl });
  assert.equal(r.error, "not-configured");
  assert.deepEqual(await db.select().from(myairAuth), []);
});
