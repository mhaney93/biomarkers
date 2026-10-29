// Imports the BodySpec DEXA scan (measured 2025-03-23) into the live DB under a "DEXA scan" group.
// Safe to re-run: biomarkers are matched by their unique name and left untouched if they already
// exist, and a reading is only added when that biomarker has none on the same date.
//
//   npx dotenv -e .env.local -- node scripts/import-dexa-scan.mjs

import { neon } from "@neondatabase/serverless";

const GROUP = "DEXA scan";
const TAKEN_AT = "2025-03-23";

// Regional assessment (p2) plus the lean percentages from the regional lean tissue report (p6–7):
// [fat %, total mass, fat tissue, lean tissue, BMC, lean %]. The report's "Total" row is the summary.
const REGIONS = {
  Arms: [40.0, 40.2, 16.1, 23.0, 1.1, 57.3],
  Legs: [40.6, 109.0, 44.2, 62.2, 2.6, 57.1],
  Trunk: [54.7, 182.2, 99.6, 79.9, 2.8, 43.8],
  Android: [60.4, 32.2, 19.4, 12.7, 0.1, 39.5],
  Gynoid: [47.6, 56.4, 26.5, 29.1, 0.7, 51.7],
};

// The regional fat tissue report (p5) prints slightly different fat percentages for these two.
const FAT_PCT_NOTES = {
  Android: "Regional fat tissue report lists 60.2%",
  Gynoid: "Regional fat tissue report lists 47.0%",
};

// Muscle balance report (p3): [fat %, total mass, fat mass, lean mass, BMC]
// The report itself prints identical right/left values for both arms and both legs; not a transcription error.
const LIMBS = {
  "Right Arm": [40.0, 20.1, 8.0, 11.5, 0.6],
  "Left Arm": [40.0, 20.1, 8.0, 11.5, 0.6],
  "Right Leg": [40.6, 54.5, 22.1, 31.1, 1.3],
  "Left Leg": [40.6, 54.5, 22.1, 31.1, 1.3],
};

// Bone density, USA (Combined NHANES/Lunar) (Enhanced Analysis), in g/cm²
const BMD = {
  Head: 2.308,
  Arms: 1.043,
  Legs: 1.364,
  Trunk: 1.174,
  Ribs: 1.132,
  Spine: 1.213,
  Pelvis: 1.197,
  Total: 1.307,
};

const composition = (prefix, category, [fatPct, mass, fat, lean, bmc, leanPct], fatPctNote = null) => [
  { name: `${prefix} Fat %`, unit: "%", category, value: fatPct, notes: fatPctNote },
  { name: `${prefix} Total Mass`, unit: "lbs", category, value: mass },
  { name: `${prefix} Fat Tissue`, unit: "lbs", category, value: fat },
  { name: `${prefix} Lean Tissue`, unit: "lbs", category, value: lean },
  { name: `${prefix} Bone Mineral Content (BMC)`, unit: "lbs", category, value: bmc },
  ...(leanPct == null ? [] : [{ name: `${prefix} Lean %`, unit: "%", category, value: leanPct }]),
];

const entries = [
  // Summary and supplemental results sit directly in the group (no category) so each shows as its own card there.
  {
    name: "Total Body Fat %",
    unit: "%",
    category: null,
    refLow: 14,
    refHigh: 24,
    value: 47.4,
    notes:
      "Range: ACE body fat categories for men, fitness through acceptable (14–24%). " +
      "BodySpec body fat percentile chart, men 30–39: above 30% is the 80th–99th percentile",
  },
  { name: "Total Mass", unit: "lbs", category: null, value: 342.9 },
  { name: "Total Fat Tissue", unit: "lbs", category: null, value: 162.4 },
  { name: "Total Lean Tissue", unit: "lbs", category: null, value: 172.9 },
  { name: "Total Lean %", unit: "%", category: null, value: 50.4 },
  { name: "Total Bone Mineral Content (BMC)", unit: "lbs", category: null, value: 7.6 },
  { name: "Intake Weight", unit: "lbs", category: null, value: 343.0 },
  // Text so it reads as feet and inches; the report prints "72.0 in."
  {
    name: "Intake Height",
    valueType: "text",
    unit: null,
    category: null,
    value: null,
    textValue: "6 ft 0 in",
    notes: "Reported as 72.0 in",
  },
  { name: "Resting Metabolic Rate (RMR)", unit: "cal/day", category: null, value: 2026 },
  {
    // The report: "Android fat should be less than Total Body Fat %. A/G Ratio should be < 1.0"
    name: "Android/Gynoid (A/G) Ratio",
    unit: null,
    category: null,
    refHigh: 1.0,
    value: 1.27,
    notes: "Range: BodySpec report, A/G ratio should be below 1.0",
  },
  {
    name: "Visceral Adipose Tissue (VAT)",
    valueType: "text",
    unit: null,
    category: null,
    value: null,
    textValue: "Mass and volume reported as N/A",
    notes: "The report's target is zero VAT",
  },
  ...Object.entries(REGIONS).flatMap(([region, values]) =>
    composition(region, region, values, FAT_PCT_NOTES[region] ?? null)
  ),
  ...Object.entries(LIMBS).flatMap(([limb, values]) => composition(limb, "Muscle Balance", values)),
  ...Object.entries(BMD).map(([region, value]) => ({
    name: `${region} Bone Mineral Density (BMD)`,
    unit: "g/cm²",
    category: "Bone Density",
    value,
  })),
  {
    name: "Total BMD Young Adult T-Score",
    unit: null,
    category: "Bone Density",
    refLow: -1.0,
    value: 1.1,
    notes: "Range: WHO, a T-score of -1.0 or higher is normal; -1.0 to -2.5 is osteopenia",
  },
  {
    name: "Total BMD Age-Matched Z-Score",
    unit: null,
    category: "Bone Density",
    refLow: -2.0,
    value: 1.1,
    notes:
      "Range: ISCD, a Z-score above -2.0 is within the expected range for age. " +
      "Z-score 0.5 to 1.5 is greater than 69%–93% of the population",
  },
];

const sql = neon(process.env.DATABASE_URL);
let createdBiomarkers = 0;
let createdReadings = 0;

for (const e of entries) {
  const { valueType = "number", refLow = null, refHigh = null, textValue = null, notes = null } = e;
  const inserted = await sql`
    insert into biomarkers (name, unit, value_type, "group", category, ref_low, ref_high)
    values (${e.name}, ${e.unit}, ${valueType}, ${GROUP}, ${e.category}, ${refLow}, ${refHigh})
    on conflict (name) do nothing
    returning id`;
  createdBiomarkers += inserted.length;
  const [{ id }] = inserted.length ? inserted : await sql`select id from biomarkers where name = ${e.name}`;

  const added = await sql`
    insert into readings (biomarker_id, value, text_value, taken_at, notes)
    select ${id}, ${e.value}, ${textValue}, ${TAKEN_AT}, ${notes}
    where not exists (select 1 from readings where biomarker_id = ${id} and taken_at = ${TAKEN_AT})
    returning id`;
  createdReadings += added.length;
}

console.log(
  `${entries.length} biomarkers: ${createdBiomarkers} created, ${entries.length - createdBiomarkers} already present. ` +
    `${createdReadings} readings added.`
);
