// Renames the blood pressure cuff's "Resting Pulse" to "Seated Pulse": it is a seated reading taken
// with blood pressure, a different measurement context from Google Health's resting heart rate
// ("Resting Heart Rate (Monthly)"), so it stays its own biomarker in Vitals. Only the name changes;
// the id, readings, range and category are left alone. Safe to re-run.
//
//   npx dotenv -e .env.local -- node scripts/rename-seated-pulse.mjs

import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const rows = await sql`
  update biomarkers set name = 'Seated Pulse'
  where id = '5abdc4a3-79a5-4cb0-a900-b3e40f69559a' and name = 'Resting Pulse'
  returning id`;
console.log(`${rows.length} biomarker renamed`);
