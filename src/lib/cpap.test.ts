import assert from "node:assert/strict";
import { test } from "vitest";
import { mapRecord, monthWindows, monthlyCpap, previousMonth, recentFrom, type CpapNight } from "@/lib/cpap";

test("mapRecord keeps the night's fields and drops records without a date", () => {
  assert.deepEqual(
    mapRecord({ startDate: "2026-10-05", totalUsage: 421.6, ahi: 1.2, leakPercentile: 6.4, maskPairCount: 2, sleepScore: 89.6 }),
    { date: "2026-10-05", usageMinutes: 421, ahi: 1.2, leak: 6.4, maskPairs: 2, score: 90 },
  );
  assert.deepEqual(mapRecord({ startDate: "2026-10-06", totalUsage: null }), {
    date: "2026-10-06",
    usageMinutes: null,
    ahi: null,
    leak: null,
    maskPairs: null,
    score: null,
  });
  assert.equal(mapRecord({ startDate: "" }), null);
  assert.equal(mapRecord({} as never), null);
});

test("monthWindows splits at month ends; previousMonth steps back", () => {
  assert.deepEqual(monthWindows("2026-10-29", "2026-11-02"), [
    { from: "2026-10-29", to: "2026-10-31" },
    { from: "2026-11-01", to: "2026-11-02" },
  ]);
  assert.deepEqual(monthWindows("2026-12-31", "2027-01-01").length, 2);
  assert.equal(previousMonth("2026-01-01"), "2025-12-01");
  assert.equal(previousMonth("2026-03-01"), "2026-02-01");
});

test("recentFrom rereads 3 nights, or 30 days with nothing stored", () => {
  assert.equal(recentFrom("2026-10-30", "2026-11-02"), "2026-10-27");
  assert.equal(recentFrom(null, "2026-11-02"), "2026-10-03");
});

const night = (date: string, usageMinutes: number | null, rest: Partial<CpapNight> = {}): CpapNight => ({
  date,
  usageMinutes,
  ahi: 2,
  leak: 10,
  maskPairs: 1,
  score: 80,
  ...rest,
});

test("monthlyCpap: usage counts zero-use nights, the rest only nights of use", () => {
  const nights = [
    ...Array.from({ length: 10 }, (_, i) => night(`2026-09-${String(i + 1).padStart(2, "0")}`, 300, { ahi: i < 5 ? 1 : 3 })),
    night("2026-09-20", 0, { ahi: 0, score: 0 }),
    night("2026-09-21", 200),
  ];
  const [m] = monthlyCpap(nights, "2026-10");
  assert.equal(m.month, "2026-09");
  assert.equal(m.date, "2026-09-30");
  assert.equal(m.nights, 12);
  assert.equal(m.usedNights, 11);
  assert.equal(m.compliantNights, 10);
  assert.equal(m.usage, Math.round((300 * 10 + 200) / 12));
  assert.equal(m.ahi, Math.round(((5 * 1 + 5 * 3 + 2) / 11) * 10) / 10);
  assert.equal(m.score, 80);
});

test("monthlyCpap leaves out short months and the current month", () => {
  const few = Array.from({ length: 9 }, (_, i) => night(`2026-09-0${i + 1}`, 300));
  const [m] = monthlyCpap(few, "2026-10");
  assert.equal(m.usage, null);
  assert.equal(m.ahi, null);
  assert.deepEqual(monthlyCpap([night("2026-10-01", 300)], "2026-10"), []);
});
