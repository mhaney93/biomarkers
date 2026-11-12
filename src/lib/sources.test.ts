import assert from "node:assert/strict";
import { test } from "vitest";
import { applyMultiSource, getPrimaryId, getSources, uniqueById, type MultiSource } from "./sources";

const config: MultiSource[] = [
  { primaryId: "scale", primarySource: "Daily scale", secondaries: [{ id: "dexa", source: "DEXA scan" }] },
];

const row = (id: string, group: string | null, category: string | null, count: number) => ({
  id,
  name: id,
  group,
  category,
  count,
});

test("getSources lists the primary first, and null for a single-source biomarker", () => {
  assert.deepEqual(getSources("scale", config), [
    { biomarkerId: "scale", source: "Daily scale", primary: true },
    { biomarkerId: "dexa", source: "DEXA scan", primary: false },
  ]);
  assert.equal(getSources("dexa", config), null);
  assert.equal(getSources("other", config), null);
});

test("getPrimaryId maps a secondary source to its biomarker", () => {
  assert.equal(getPrimaryId("dexa", config), "scale");
  assert.equal(getPrimaryId("scale", config), null);
});

test("applyMultiSource lists the shared biomarker in every source's place with a combined count", () => {
  const out = applyMultiSource(
    [row("dexa", "DEXA scan", null, 1), row("other", null, "Vitals", 2), row("scale", null, "Vitals", 6)],
    config
  );
  assert.deepEqual(out, [
    { ...row("scale", "DEXA scan", null, 7) },
    row("other", null, "Vitals", 2),
    row("scale", null, "Vitals", 7),
  ]);
  assert.deepEqual(uniqueById(out).map((b) => b.id), ["scale", "other"]);
});

test("applyMultiSource leaves a secondary alone when its primary is missing", () => {
  const out = applyMultiSource([row("dexa", "DEXA scan", null, 1)], config);
  assert.deepEqual(out, [row("dexa", "DEXA scan", null, 1)]);
});
