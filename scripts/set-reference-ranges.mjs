// Fills reference ranges on the Sleep and Vitals biomarkers that had none (researched best guesses for
// an adult male, 33, 6 ft 0 in). Only rows with no low and no high are touched, and only ref_low /
// ref_high change; results, units and categories are left alone. The DEXA ranges live in
// scripts/import-dexa-scan.mjs and the sync-created ones in src/lib/sleep.ts and src/lib/cpap.ts.
//
//   npx dotenv -e .env.local -- node scripts/set-reference-ranges.mjs

import { neon } from "@neondatabase/serverless";

const RANGES = {
  "Average Bedtime (Monthly)": [null, 24], // asleep by midnight; Blueprint ~8:30-9 PM, standard advice 10 PM-midnight
  "Average Wake Time (Monthly)": [null, 8], // up by about 8 AM; standard adult schedule 5:30-8 AM
  "CPAP Mask On/Off (Monthly)": [null, 2], // best guess: 2 or fewer interruptions a night
  "Heart Rate Variability (Monthly)": [40, null], // sleeping RMSSD, men in their 30s average ~40-60 ms
  "Resting Heart Rate (Monthly)": [40, 70], // trained adults 40-60; AHA 60-100 would flag a runner
  "Sleep Consistency (Monthly)": [null, 60], // bed/wake SD within ~30-60 min
  "myAir Score (Monthly)": [80, null], // best guess: 80+ is a good night
  "Body Weight": [136, 184], // BMI 18.5-24.9 at 6 ft 0 in
};

const sql = neon(process.env.DATABASE_URL);
let updated = 0;
for (const [name, [low, high]] of Object.entries(RANGES)) {
  const rows = await sql`
    update biomarkers set ref_low = ${low}, ref_high = ${high}
    where name = ${name} and ref_low is null and ref_high is null
    returning id`;
  updated += rows.length;
}
console.log(`${Object.keys(RANGES).length} ranges, ${updated} biomarkers updated`);
