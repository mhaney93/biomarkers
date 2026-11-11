// Imports the BodySpec DEXA scan (measured 2025-03-23) into the live DB under a "DEXA scan" group.
// Safe to re-run: biomarkers are matched by their unique name. Missing biomarkers are created, and a
// reading is added when that biomarker has none on the scan date. Existing biomarkers in the "DEXA scan"
// group get their unit, value type, category and range synced to this script, and their scan-date
// readings get their value, text value and notes synced. Biomarkers in other groups and readings on
// other dates are never modified.
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

// Best-guess reference ranges for results the report gives no range for (adult male, 33, 6 ft 0 in).
// Healthy weight is BMI 18.5–24.9 at 72 in (136–184 lbs). Fat % uses the ACE fitness-to-acceptable
// band already on Total Body Fat % (14–24%), widened for the trunk and android regions where men
// carry more fat (15–28%). Regional masses are typical lean-adult shares of body mass; bone mineral
// content shares come from this scan. Bone density is one-sided: low is the concern (T-score below -1
// is about one SD under the NHANES/Lunar young-adult mean), per regional Lunar reference means.
const W = [136, 184];
const SHARE = { Arms: 0.12, Legs: 0.34, Trunk: 0.48, Android: 0.07, Gynoid: 0.14, "Right Arm": 0.06, "Left Arm": 0.06, "Right Leg": 0.17, "Left Leg": 0.17 };
const BONE_SHARE = { Arms: 0.14, Legs: 0.34, Trunk: 0.37, Android: 0.013, Gynoid: 0.09, "Right Arm": 0.07, "Left Arm": 0.07, "Right Leg": 0.17, "Left Leg": 0.17 };
const BMC_TOTAL = [6, 9];
const FAT = { Trunk: [15, 28], Android: [15, 28] };
const BMD_LOW = { Head: 1.9, Arms: 0.95, Legs: 1.2, Trunk: 1.0, Ribs: 0.95, Spine: 1.06, Pelvis: 1.05, Total: 1.18 };
const r1 = (n) => Math.round(n * 10) / 10;
const RANGE_NOTE =
  "Range: best-guess for an adult male at 6 ft 0 in (healthy weight BMI 18.5–24.9, ACE body fat 14–24%, typical regional proportions)";

function guessRange(name) {
  let m;
  if (name === "Total Mass" || name === "Intake Weight") return { refLow: W[0], refHigh: W[1] };
  if (name === "Total Fat Tissue") return { refLow: r1((W[0] * 0.14)), refHigh: r1(W[1] * 0.24) };
  if (name === "Total Lean Tissue") return { refLow: r1(W[0] * 0.76), refHigh: r1(W[1] * 0.86) };
  if (name === "Total Lean %") return { refLow: 76, refHigh: 86 };
  if (name === "Total Bone Mineral Content (BMC)") return { refLow: BMC_TOTAL[0], refHigh: BMC_TOTAL[1] };
  if (name === "Resting Metabolic Rate (RMR)") return { refLow: 1450, refHigh: 2000, note: "Range: best-guess, Mifflin-St Jeor for a 33-year-old male, 6 ft 0 in, at healthy weight (136–184 lbs) ±10%" };
  if ((m = name.match(/^(.+) Bone Mineral Density \(BMD\)$/))) return { refLow: BMD_LOW[m[1]], note: "Range: best-guess lower limit (about T-score -1 against Lunar young-adult male reference); low is the concern" };
  if ((m = name.match(/^(.+) (Fat %|Lean %|Total Mass|Fat Tissue|Lean Tissue|Bone Mineral Content \(BMC\))$/)) && SHARE[m[1]]) {
    const [region, kind] = [m[1], m[2]];
    const [fl, fh] = FAT[region] ?? [14, 24];
    const mass = [SHARE[region] * W[0], SHARE[region] * W[1]];
    if (kind === "Fat %") return { refLow: fl, refHigh: fh };
    if (kind === "Lean %") return { refLow: 100 - fh, refHigh: 100 - fl };
    if (kind === "Total Mass") return { refLow: r1(mass[0]), refHigh: r1(mass[1]) };
    if (kind === "Fat Tissue") return { refLow: r1((mass[0] * fl) / 100), refHigh: r1((mass[1] * fh) / 100) };
    if (kind === "Lean Tissue") return { refLow: r1((mass[0] * (100 - fh)) / 100), refHigh: r1((mass[1] * (100 - fl)) / 100) };
    if (region === "Android") return { refLow: 0, refHigh: 0.2 }; // tiny region; rounding would collapse the range
    return { refLow: r1(BONE_SHARE[region] * BMC_TOTAL[0]), refHigh: r1(BONE_SHARE[region] * BMC_TOTAL[1]) };
  }
  return null;
}

for (const e of entries) {
  if (e.refLow != null || e.refHigh != null || (e.valueType ?? "number") === "text") continue;
  const g = guessRange(e.name);
  if (!g) continue;
  e.refLow = g.refLow ?? null;
  e.refHigh = g.refHigh ?? null;
  e.notes = [e.notes, g.note ?? RANGE_NOTE].filter(Boolean).join(". ");
}

const sql = neon(process.env.DATABASE_URL);
let createdBiomarkers = 0;
let createdReadings = 0;
let updatedBiomarkers = 0;
let updatedReadings = 0;

for (const e of entries) {
  const { valueType = "number", refLow = null, refHigh = null, textValue = null, notes = null } = e;
  const inserted = await sql`
    insert into biomarkers (name, unit, value_type, "group", category, ref_low, ref_high)
    values (${e.name}, ${e.unit}, ${valueType}, ${GROUP}, ${e.category}, ${refLow}, ${refHigh})
    on conflict (name) do nothing
    returning id`;
  createdBiomarkers += inserted.length;
  const [{ id, group }] = inserted.length
    ? [{ id: inserted[0].id, group: GROUP }]
    : await sql`select id, "group" from biomarkers where name = ${e.name}`;

  if (!inserted.length && group === GROUP) {
    const updated = await sql`
      update biomarkers
      set unit = ${e.unit}, value_type = ${valueType}, category = ${e.category}, ref_low = ${refLow}, ref_high = ${refHigh}
      where id = ${id}
        and (unit is distinct from ${e.unit} or value_type is distinct from ${valueType}
          or category is distinct from ${e.category} or ref_low is distinct from ${refLow}
          or ref_high is distinct from ${refHigh})
      returning id`;
    updatedBiomarkers += updated.length;

    const updatedRows = await sql`
      update readings
      set value = ${e.value}, text_value = ${textValue}, notes = ${notes}
      where biomarker_id = ${id} and taken_at = ${TAKEN_AT}
        and (value is distinct from ${e.value} or text_value is distinct from ${textValue}
          or notes is distinct from ${notes})
      returning id`;
    updatedReadings += updatedRows.length;
  }

  const added = await sql`
    insert into readings (biomarker_id, value, text_value, taken_at, notes)
    select ${id}, ${e.value}, ${textValue}, ${TAKEN_AT}, ${notes}
    where not exists (select 1 from readings where biomarker_id = ${id} and taken_at = ${TAKEN_AT})
    returning id`;
  createdReadings += added.length;
}

console.log(
  `${entries.length} biomarkers: ${createdBiomarkers} created, ${entries.length - createdBiomarkers} already present, ${updatedBiomarkers} updated. ` +
    `${createdReadings} readings added, ${updatedReadings} updated.`
);
