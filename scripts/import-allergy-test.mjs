// Imports the Quest Diagnostics allergen panel (specimen collected 2017-02-11) into the live DB,
// plus a text note on when to retest.
// Safe to re-run: biomarkers are matched by their unique name and left untouched if they already
// exist, and a reading is only added when that biomarker has none on the same date.
//
//   npx dotenv -e .env.local -- node scripts/import-allergy-test.mjs

import { neon } from "@neondatabase/serverless";

const GROUP = "Allergy Test";
const TAKEN_AT = "2017-02-11";
const UNIT = "kU/L";

// Allergen-specific IgE: the lab's reference is "0.09 kU/L" and anything at or above 0.10 is
// flagged. Results printed as "<0.10" (undetectable, class 0) are stored as 0 with a note.
const UNDETECTABLE = null;

const ALLERGENS = {
  Food: [
    ["Egg White (F1) IgE", UNDETECTABLE],
    ["Peanut (F13) IgE", UNDETECTABLE],
    ["Wheat (F4) IgE", 0.22],
    ["Walnut (F256) IgE", UNDETECTABLE],
    ["Codfish (F3) IgE", UNDETECTABLE],
    ["Cow's Milk (F2) IgE", UNDETECTABLE],
    ["Soybean (F14) IgE", UNDETECTABLE],
    ["Shrimp (F24) IgE", UNDETECTABLE],
    ["Scallop (F338) IgE", UNDETECTABLE],
    ["Sesame Seed (F10) IgE", 0.42],
    ["Hazelnut (F17) IgE", UNDETECTABLE],
    ["Cashew Nut (F202) IgE", UNDETECTABLE],
    ["Almond (F20) IgE", UNDETECTABLE],
    ["Salmon (F41) IgE", UNDETECTABLE],
    ["Tuna (F40) IgE", UNDETECTABLE],
  ],
  "Mites & Molds": [
    ["Dust Mite, D. pteronyssinus (D1) IgE", UNDETECTABLE],
    ["Dust Mite, D. farinae (D2) IgE", UNDETECTABLE],
    ["Penicillium Mold (M1) IgE", 1.81],
    ["Cladosporium Mold (M2) IgE", 2.36],
    ["Aspergillus Mold (M3) IgE", 2.31],
    ["Alternaria Mold (M6) IgE", 3.91],
  ],
  Trees: [
    ["Alder (T2) IgE", UNDETECTABLE],
    ["Mountain Cedar (T6) IgE", 0.12],
    ["Olive Tree (T9) IgE", 0.13],
    ["Walnut Tree (T10) IgE", 0.4],
    ["Cottonwood (T14) IgE", UNDETECTABLE],
    ["Oak (T7) IgE", UNDETECTABLE],
    ["Elm (T8) IgE", 0.18],
    ["White Mulberry (T70) IgE", UNDETECTABLE],
  ],
  Grasses: [
    ["Bermuda Grass (G2) IgE", 0.42],
    ["Timothy Grass (G6) IgE", 0.73],
    ["Johnson Grass (G10) IgE", 0.54],
  ],
  Weeds: [
    ["Common Ragweed, Short (W1) IgE", UNDETECTABLE],
    ["Mugwort (W6) IgE", UNDETECTABLE],
    ["Russian Thistle (W11) IgE", UNDETECTABLE],
    ["Rough Pigweed (W14) IgE", UNDETECTABLE],
  ],
  "Animals & Pests": [
    ["Cat Dander (E1) IgE", UNDETECTABLE],
    ["Dog Dander (E5) IgE", UNDETECTABLE],
    ["Cockroach (I6) IgE", UNDETECTABLE],
    ["Mouse Urine Proteins (E72) IgE", UNDETECTABLE],
  ],
};

const entries = [
  // Total IgE and the retest note sit directly in the group (no category) so each shows as its own card there.
  { name: "Immunoglobulin E (IgE), Total", category: null, refLow: 0, refHigh: 114, value: 49, notes: null },
  ...Object.entries(ALLERGENS).flatMap(([category, rows]) =>
    rows.map(([name, value]) => ({
      name,
      category,
      refLow: 0,
      refHigh: 0.09,
      value: value ?? 0,
      notes: value == null ? "Reported as <0.10 kU/L (class 0, undetectable)" : null,
    }))
  ),
  {
    name: "Retest Guidance",
    valueType: "text",
    unit: null,
    category: null,
    refLow: null,
    refHigh: null,
    takenAt: "2026-10-19",
    value: null,
    textValue:
      "No fixed retest schedule for adults. Retest when symptoms change, before starting allergy shots " +
      "(immunotherapy), or when a result would change a decision (new home or land, pets, diet). Last tested " +
      "Feb 2017 (Quest), so a retest is due. A mold allergy (Penicillium) is not a penicillin drug allergy. " +
      "This panel tested no medications.",
    notes: null,
  },
];

const sql = neon(process.env.DATABASE_URL);
let createdBiomarkers = 0;
let createdReadings = 0;

for (const e of entries) {
  const { valueType = "number", unit = UNIT, takenAt = TAKEN_AT, textValue = null } = e;
  const inserted = await sql`
    insert into biomarkers (name, unit, value_type, "group", category, ref_low, ref_high)
    values (${e.name}, ${unit}, ${valueType}, ${GROUP}, ${e.category}, ${e.refLow}, ${e.refHigh})
    on conflict (name) do nothing
    returning id`;
  createdBiomarkers += inserted.length;
  const [{ id }] = inserted.length ? inserted : await sql`select id from biomarkers where name = ${e.name}`;

  const added = await sql`
    insert into readings (biomarker_id, value, text_value, taken_at, notes)
    select ${id}, ${e.value}, ${textValue}, ${takenAt}, ${e.notes}
    where not exists (select 1 from readings where biomarker_id = ${id} and taken_at = ${takenAt})
    returning id`;
  createdReadings += added.length;
}

console.log(
  `${entries.length} biomarkers: ${createdBiomarkers} created, ${entries.length - createdBiomarkers} already present. ` +
    `${createdReadings} readings added.`
);
