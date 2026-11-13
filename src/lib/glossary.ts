// Plain-English definitions for every abbreviation, unit and technical term the site shows.
// Pages hand the strings they render (biomarker names, units, notes, ...) to `findTerms`, which
// returns only the entries that actually occur, so new biomarkers pick up definitions
// automatically as long as their unit/name matches an entry here.

export type GlossaryEntry = {
  term: string;
  /** Matched against the page text; must not match inside a longer word or unit. */
  match: RegExp;
  definition: string;
};

// Not preceded/followed by a letter or digit, so "ms" does not match inside "items" or "mmHg".
const w = (src: string, flags = "") => new RegExp(`(?<![A-Za-z0-9])(?:${src})(?![A-Za-z0-9])`, flags);

export const GLOSSARY: GlossaryEntry[] = [
  // Statistics and general
  { term: "SD", match: w("SD|min SD"), definition: "Standard deviation: how much a value typically varies around its average. For Sleep consistency it is the spread of your bed and wake times in minutes, so a lower number means a steadier schedule." },
  { term: "Z-score", match: w("Z-Score", "i"), definition: "How many standard deviations a result is from the average for people of the same age and sex. 0 is average; below -2 is unusually low." },
  { term: "T-score", match: w("T-Score", "i"), definition: "How many standard deviations a bone density result is from the average healthy young adult. Above -1 is normal; -1 to -2.5 suggests low bone mass; below -2.5 suggests osteoporosis." },
  { term: "%", match: /%/, definition: "Percent: parts per hundred. In status badges such as “12% high”, it is how far past the reference range the value is, relative to the nearest range limit." },
  { term: "Reference range / ref", match: w("ref|reference", "i"), definition: "The span of values considered healthy or typical for this measurement. Results below it are marked Low and above it High. Shown as low–high; “–” means that end has no limit." },
  { term: "Low / In range / High", match: w("Low|In range|High|No range set|No readings yet"), definition: "Status badges comparing the latest result with its reference range: Low is below it, In range is inside it, High is above it. “No range set” means no reference range has been entered; “No readings yet” means nothing is recorded." },
  { term: "Due for a retest", match: w("Due for a retest", "i"), definition: "The last result was out of range but is old enough that it may no longer reflect your current state, so it is worth testing again." },
  { term: "Monthly", match: w("Monthly"), definition: "The value is the average over a calendar month of synced nightly data. The current month is a month-to-date average." },
  { term: "Class 0–6", match: w("Class [0-6](?:/1)?"), definition: "The lab's severity scale for allergen-specific IgE: 0 absent, 0/1 very low, 1 low, 2 moderate, 3 high, 4 to 6 very high." },
  { term: "IgE", match: w("IgE"), definition: "Immunoglobulin E: the antibody the immune system makes against allergens. Higher levels to a specific allergen mean stronger sensitization to it." },

  // Units
  { term: "bpm", match: w("bpm"), definition: "Beats per minute: heart rate." },
  { term: "ms", match: w("ms"), definition: "Milliseconds: thousandths of a second." },
  { term: "breaths/min", match: w("breaths/min"), definition: "Breaths per minute: respiratory rate." },
  { term: "mL/kg/min", match: w("mL/kg/min"), definition: "Millilitres of oxygen used per kilogram of body weight per minute: the unit for VO2 max." },
  { term: "L/min", match: w("L/min"), definition: "Litres per minute: airflow rate." },
  { term: "events/h", match: w("events/h"), definition: "Events per hour of sleep: how often breathing stops or slows." },
  { term: "°F vs baseline", match: /°[CF] vs baseline/, definition: "Degrees Fahrenheit above (+) or below (-) your own usual skin temperature, not an absolute temperature." },
  { term: "°F", match: /°[CF]/, definition: "Degrees Fahrenheit." },
  { term: "h (24 = midnight)", match: /\bh \(24 = midnight\)/, definition: "Hours on a 24-hour clock where 24 means midnight, so 23.5 is 11:30 PM and 25 is 1:00 AM." },
  { term: "h (6.5 = 6:30 AM)", match: /\bh \(6\.5 = 6:30 AM\)/, definition: "Hours on a 24-hour clock with decimals for minutes, so 6.5 is 6:30 AM." },
  { term: "h:m", match: w("h:m|Duration \\(h:m\\)"), definition: "Hours and minutes." },
  { term: "per night", match: w("per night"), definition: "Counted once per night of sleep." },
  { term: "points", match: w("points"), definition: "Score points on the myAir scale, 0 to 100; higher is better." },
  { term: "lbs", match: w("lbs"), definition: "Pounds of weight." },
  { term: "g/cm²", match: /g\/cm²/, definition: "Grams per square centimetre: bone mineral density." },
  { term: "cal/day", match: w("cal/day"), definition: "Calories per day." },
  { term: "mg/dL", match: w("mg/dL"), definition: "Milligrams per deciliter: concentration in blood." },
  { term: "g/dL", match: w("g/dL"), definition: "Grams per deciliter: concentration in blood." },
  { term: "µg/dL", match: w("[µμ]g/dL|mcg/dL"), definition: "Micrograms per deciliter: concentration in blood." },
  { term: "ng/mL", match: w("ng/mL"), definition: "Nanograms per milliliter: concentration in blood." },
  { term: "pg/mL", match: w("pg/mL"), definition: "Picograms per milliliter: concentration in blood." },
  { term: "nmol/L", match: w("nmol/L"), definition: "Nanomoles per liter: concentration in blood by number of molecules." },
  { term: "pmol/L", match: w("pmol/L"), definition: "Picomoles per liter: concentration in blood by number of molecules." },
  { term: "mmol/L", match: w("mmol/L"), definition: "Millimoles per liter: concentration in blood by number of molecules." },
  { term: "mEq/L", match: w("mEq/L"), definition: "Milliequivalents per liter: electrolyte concentration in blood." },
  { term: "IU/L, U/L", match: w("m?IU/L|U/L|[µμ]IU/mL"), definition: "International units (or enzyme units) per liter: concentration measured by biological activity, used for enzymes and hormones." },
  { term: "kU/L", match: w("kU/L"), definition: "Kilounits per liter: how much allergen-specific IgE antibody is in the blood." },
  { term: "mmHg", match: w("mmHg"), definition: "Millimeters of mercury: blood pressure." },
  { term: "fL / pg", match: w("fL"), definition: "Femtoliters: the volume of a single blood cell." },
  { term: "x10^3/µL", match: /10\^?[3369]\/[µμ]L/, definition: "Thousands (or millions) of cells per microliter of blood." },

  // Terms
  { term: "HRV", match: w("Heart Rate Variability|HRV"), definition: "Heart rate variability: the tiny beat-to-beat changes in timing between heartbeats. Higher usually means better recovery and fitness." },
  { term: "RMSSD", match: w("RMSSD"), definition: "Root mean square of successive differences: the standard way HRV is calculated, in milliseconds." },
  { term: "SpO2", match: w("SpO2"), definition: "Blood oxygen saturation: the percent of your red blood cells carrying oxygen. 95–100% is typical." },
  { term: "VO2 max", match: w("VO2 Max", "i"), definition: "The most oxygen your body can use during hard exercise: a standard measure of cardio fitness. Higher is better." },
  { term: "Fitbit estimate", match: w("Fitbit estimate"), definition: "Calculated by Fitbit from heart rate and activity, not measured in a lab." },
  { term: "CPAP", match: w("CPAP"), definition: "Continuous positive airway pressure: a machine and mask that keeps the airway open during sleep to treat sleep apnea." },
  { term: "AHI", match: w("AHI"), definition: "Apnea–hypopnea index: breathing pauses (apneas) plus shallow breaths (hypopneas) per hour of sleep. Under 5 is normal; 5–15 mild, 15–30 moderate, above 30 severe sleep apnea." },
  { term: "Mask Leak", match: w("Mask Leak"), definition: "Air escaping around the CPAP mask. Lower is better; large leaks reduce therapy quality." },
  { term: "Mask On/Off", match: w("Mask On/Off"), definition: "How many times the CPAP mask was taken off and put back on during the night." },
  { term: "myAir Score", match: w("myAir"), definition: "ResMed's 0–100 sleep-therapy score combining usage hours, mask seal, events per hour and number of mask on/offs." },
  { term: "Time in bed", match: w("Time in Bed", "i"), definition: "Minutes from the start to the end of the night's main sleep, asleep or awake." },
  { term: "Sleep efficiency", match: w("Sleep Efficiency", "i"), definition: "The percent of time in bed spent asleep. 85% or more is normal; lower means more of the night was spent awake." },
  { term: "Sleep stages", match: w("Deep Sleep|REM Sleep|Light Sleep|sleep stages", "i"), definition: "The watch's estimate of light, deep and REM sleep from movement and heart rate. Light sleep is about half the night; deep sleep (physically restorative) about 13–23%; REM (dreaming, memory) about 20–25%." },
  { term: "REM", match: w("REM"), definition: "Rapid eye movement sleep: the stage when most dreaming happens, important for memory and mood." },
  { term: "WASO", match: w("WASO|Awake Time After Falling Asleep"), definition: "Wake after sleep onset: minutes awake between first falling asleep and the final wake-up." },
  { term: "Awakenings", match: w("Awakenings"), definition: "Times awake for 5 minutes or more after first falling asleep, per night." },
  { term: "Resting Heart Rate", match: w("Resting Heart Rate"), definition: "Heart rate while at complete rest, measured during sleep. Lower generally means better cardiovascular fitness." },
  { term: "Skin Temperature Variation", match: w("Skin Temperature"), definition: "How far your skin temperature overnight sits from your personal baseline. Raised values can accompany illness or stress." },
  { term: "DEXA", match: w("DEXA|DXA"), definition: "Dual-energy X-ray absorptiometry: a low-dose X-ray scan that measures body fat, lean tissue and bone density." },
  { term: "BMD", match: w("BMD|Bone Mineral Density"), definition: "Bone mineral density: the amount of bone mineral per area, in g/cm². Low values indicate weaker bones." },
  { term: "BMC", match: w("BMC"), definition: "Bone mineral content: the total weight of bone mineral in a region." },
  { term: "RMR", match: w("RMR"), definition: "Resting metabolic rate: calories your body burns per day at rest." },
  { term: "VAT", match: w("VAT|Visceral Adipose Tissue"), definition: "Visceral adipose tissue: fat stored deep around the abdominal organs. High levels raise heart and metabolic disease risk." },
  { term: "A/G ratio", match: w("A/G|Android/Gynoid"), definition: "Android/gynoid ratio: fat around the belly (android) divided by fat around hips and thighs (gynoid). Lower is healthier." },
  { term: "Lean tissue", match: w("Lean Tissue|Lean %"), definition: "Everything that is not fat or bone: mostly muscle and organs." },
  { term: "LDL / HDL", match: w("LDL|HDL|VLDL"), definition: "Low- and high-density lipoprotein cholesterol. LDL is “bad” cholesterol (lower is better); HDL is “good” cholesterol (higher is better)." },
  { term: "HbA1c", match: w("HbA1c|A1c", "i"), definition: "Hemoglobin A1c: average blood sugar over about three months." },
  { term: "ALT / AST", match: w("ALT|AST"), definition: "Liver enzymes that rise when liver cells are damaged." },
  { term: "TSH", match: w("TSH"), definition: "Thyroid-stimulating hormone: the signal that tells the thyroid how hard to work." },
  { term: "CRP", match: w("hs-?CRP|CRP"), definition: "C-reactive protein: a blood marker of inflammation." },
  { term: "eGFR", match: w("eGFR"), definition: "Estimated glomerular filtration rate: how well the kidneys filter blood." },
  { term: "BUN", match: w("BUN"), definition: "Blood urea nitrogen: a waste product the kidneys clear." },
  { term: "PSA", match: w("PSA"), definition: "Prostate-specific antigen: a protein made by the prostate." },
];

/** Entries whose pattern occurs in any of the given strings, in glossary order. */
export function findTerms(texts: Iterable<string | null | undefined>): GlossaryEntry[] {
  const hay = [...texts].filter((t): t is string => !!t).join("\n");
  return GLOSSARY.filter((e) => e.match.test(hay));
}
