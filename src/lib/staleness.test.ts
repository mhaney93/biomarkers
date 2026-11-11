import assert from "node:assert/strict";
import { test } from "vitest";
import { STALE_AFTER_DAYS, ageInDays, getMeasurementKind, isStale } from "./staleness";

const now = new Date("2026-11-10T15:00:00Z");
const daysAgo = (n: number) => new Date(Date.UTC(2026, 10, 10 - n)).toISOString().slice(0, 10);

const cases = [
  { kind: "labs", b: { name: "LDL Cholesterol", category: "Lipids" } },
  { kind: "daily", b: { name: "Resting Heart Rate (Monthly)", category: "Sleep" } },
  { kind: "vitals", b: { name: "Systolic Blood Pressure", category: null } },
] as const;

for (const { kind, b } of cases) {
  test(`${kind}: kind detection`, () => assert.equal(getMeasurementKind(b), kind));
  const w = STALE_AFTER_DAYS[kind];
  test(`${kind}: exactly at window is current, one day past is stale`, () => {
    assert.equal(isStale(b, daysAgo(w), now), false);
    assert.equal(isStale(b, daysAgo(w + 1), now), true);
    assert.equal(isStale(b, daysAgo(0), now), false);
  });
}

test("weight is vitals but intake weight is not", () => {
  assert.equal(getMeasurementKind({ name: "Weight", category: null }), "vitals");
  assert.equal(getMeasurementKind({ name: "Intake Weight", category: null }), "labs");
});

test("ageInDays counts whole days", () => assert.equal(ageInDays("2026-11-09", now), 1));
