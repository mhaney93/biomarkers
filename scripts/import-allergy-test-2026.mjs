// Imports the Quest allergy retest (specimen collected 2026-11-16: Food and Tree Nut Allergy Panel +
// Respiratory Allergy Profile Region XIII) as a second dated reading on the 2017 allergen biomarkers
// (see import-allergy-test.mjs), adding biomarkers only for allergens new in this panel.
// These are sensitization results (IgE blood test), not confirmed allergies, pending the doctor's
// review on 2026-12-02; every reading says so in its note, and a text card in the group repeats it.
// Safe to re-run: biomarkers are matched by unique name, and a reading is only added when that
// biomarker has none on the same date.
//
//   npx dotenv -e .env.local -- node scripts/import-allergy-test-2026.mjs

import { neon } from "@neondatabase/serverless";

const GROUP = "Allergy Test";
const TAKEN_AT = "2026-11-16";
const UNIT = "kU/L";
const PENDING = "Sensitization (IgE blood test), not a confirmed allergy. Pending doctor review 2026-12-02.";
const UNDETECTABLE = null; // printed "<0.10" or "Negative": stored as 0 with a note, like the 2017 import

const ALLERGENS = {
  Food: [
    ["Egg White (F1) IgE", UNDETECTABLE],
    ["Peanut (F13) IgE", UNDETECTABLE],
    ["Wheat (F4) IgE", 0.95],
    ["Walnut (F256) IgE", UNDETECTABLE],
    ["Codfish (F3) IgE", 0.25],
    ["Cow's Milk (F2) IgE", 0.17],
    ["Soybean (F14) IgE", UNDETECTABLE],
    ["Shrimp (F24) IgE", UNDETECTABLE],
    ["Scallop (F338) IgE", UNDETECTABLE],
    ["Sesame Seed (F10) IgE", 0.14],
    ["Hazelnut (F17) IgE", UNDETECTABLE],
    ["Cashew Nut (F202) IgE", UNDETECTABLE],
    ["Almond (F20) IgE", UNDETECTABLE],
    ["Brazil Nut (F18) IgE", UNDETECTABLE],
    ["Macadamia Nut (F345) IgE", UNDETECTABLE],
    ["Salmon (F41) IgE", 0.47, "Reaction after a sesame-crusted salmon dinner (Nov 2026)."],
    ["Tuna (F40) IgE", 0.21],
  ],
  "Mites & Molds": [
    ["Dust Mite, D. pteronyssinus (D1) IgE", UNDETECTABLE],
    ["Dust Mite, D. farinae (D2) IgE", UNDETECTABLE],
    ["Penicillium Mold (M1) IgE", 0.4],
    ["Cladosporium Mold (M2) IgE", 0.61],
    ["Aspergillus Mold (M3) IgE", 0.94],
    ["Alternaria Mold (M6) IgE", 1.74],
  ],
  Trees: [
    ["Alder (T2) IgE", UNDETECTABLE],
    ["Mountain Cedar (T6) IgE", UNDETECTABLE],
    ["Olive Tree (T9) IgE", UNDETECTABLE],
    ["Walnut Tree (T10) IgE", 0.15],
    ["Cottonwood (T14) IgE", 0.1],
    ["Oak (T7) IgE", UNDETECTABLE],
    ["Elm (T8) IgE", UNDETECTABLE],
    ["White Mulberry (T70) IgE", UNDETECTABLE],
  ],
  Grasses: [
    ["Bermuda Grass (G2) IgE", 1.1],
    ["Timothy Grass (G6) IgE", 2.27],
    ["Johnson Grass (G10) IgE", 1.24],
  ],
  Weeds: [
    ["Common Ragweed, Short (W1) IgE", UNDETECTABLE],
    ["Mugwort (W6) IgE", UNDETECTABLE],
    ["Russian Thistle (W11) IgE", UNDETECTABLE],
    ["Rough Pigweed (W14) IgE", UNDETECTABLE],
  ],
  "Animals & Pests": [
    ["Cat Dander (E1) IgE", UNDETECTABLE],
    ["Dog Dander (E5) IgE", 0.34],
    ["Dog Can f 1 IgE", UNDETECTABLE],
    ["Dog Can f 2 IgE", UNDETECTABLE],
    ["Dog Can f 3 IgE", UNDETECTABLE],
    ["Dog Can f 4 IgE", UNDETECTABLE],
    ["Dog Can f 5 IgE", 0.37, "Lab note: Can f 5 alone (male dog protein) may mean female dogs are tolerated."],
    ["Dog Can f 6 IgE", UNDETECTABLE],
    ["Cockroach (I6) IgE", UNDETECTABLE],
    ["Mouse Urine Proteins (E72) IgE", UNDETECTABLE],
  ],
};

const entries = [
  { name: "Immunoglobulin E (IgE), Total", category: null, refLow: 0, refHigh: 114, value: 63, notes: PENDING },
  ...Object.entries(ALLERGENS).flatMap(([category, rows]) =>
    rows.map(([name, value, extra]) => ({
      name,
      category,
      refLow: 0,
      refHigh: 0.09,
      value: value ?? 0,
      notes: [value == null ? "Reported as <0.10 kU/L (class 0, undetectable)." : null, extra, PENDING]
        .filter(Boolean)
        .join(" "),
    }))
  ),
  {
    name: "Nov 2026 Results Status",
    valueType: "text",
    unit: null,
    category: null,
    refLow: null,
    refHigh: null,
    value: null,
    textValue:
      "Retested 2026-11-16 (Quest). These are sensitization results from an IgE blood test, not confirmed " +
      "allergies, and have not yet been reviewed by a doctor (visit 2026-12-02). Reaction that prompted the " +
      "test: a sesame-crusted salmon dinner (Nov 2026); salmon is class 1, sesame 0/1.",
    notes: null,
  },
];

const sql = neon(process.env.DATABASE_URL);
let createdBiomarkers = 0;
let createdReadings = 0;

for (const e of entries) {
  const { valueType = "number", unit = UNIT, textValue = null } = e;
  const inserted = await sql`
    insert into biomarkers (name, unit, value_type, "group", category, ref_low, ref_high)
    values (${e.name}, ${unit}, ${valueType}, ${GROUP}, ${e.category}, ${e.refLow}, ${e.refHigh})
    on conflict (name) do nothing
    returning id`;
  createdBiomarkers += inserted.length;
  const [{ id }] = inserted.length ? inserted : await sql`select id from biomarkers where name = ${e.name}`;

  const added = await sql`
    insert into readings (biomarker_id, value, text_value, taken_at, notes)
    select ${id}, ${e.value}, ${textValue}, ${TAKEN_AT}, ${e.notes}
    where not exists (select 1 from readings where biomarker_id = ${id} and taken_at = ${TAKEN_AT})
    returning id`;
  createdReadings += added.length;
}

console.log(
  `${entries.length} biomarkers: ${createdBiomarkers} created, ${entries.length - createdBiomarkers} already present. ` +
    `${createdReadings} readings added.`
);
