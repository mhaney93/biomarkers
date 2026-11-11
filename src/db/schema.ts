import { pgTable, uuid, text, numeric, date, timestamp, index, integer, boolean, real, jsonb } from "drizzle-orm/pg-core";

export const biomarkers = pgTable("biomarkers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  unit: text("unit"),
  valueType: text("value_type").notNull().default("number"),
  group: text("group"),
  category: text("category"),
  refLow: numeric("ref_low"),
  refHigh: numeric("ref_high"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const readings = pgTable(
  "readings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    biomarkerId: uuid("biomarker_id")
      .notNull()
      .references(() => biomarkers.id, { onDelete: "cascade" }),
    value: numeric("value"),
    textValue: text("text_value"),
    takenAt: date("taken_at").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("readings_biomarker_id_idx").on(table.biomarkerId)]
);

// The owner's Google connection for the sleep sync (one row, id 1). Never sent to the browser.
export const googleAuth = pgTable("google_auth", {
  id: integer("id").primaryKey(),
  refreshToken: text("refresh_token").notNull(),
  scope: text("scope"),
  connectedAt: timestamp("connected_at", { withTimezone: true }).notNull().defaultNow(),
  // Exclusive end of the wake dates scanned so far; null until the first sync.
  sleepSyncedTo: date("sleep_synced_to", { mode: "string" }),
  // Which set of Google Health data types the scan has covered (SYNC_VERSION in lib/sleep.ts); a
  // lower value makes the next sync rescan all history.
  sleepSyncVersion: integer("sleep_sync_version").notNull().default(0),
  lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
  lastSync: jsonb("last_sync"),
});

// Nightly sleep sessions from Google Health, keyed by Google's data point id.
export const sleepSessions = pgTable(
  "sleep_sessions",
  {
    sleepId: text("sleep_id").primaryKey(),
    wakeDate: date("wake_date", { mode: "string" }).notNull(),
    startTime: timestamp("start_time", { withTimezone: true, mode: "string" }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true, mode: "string" }).notNull(),
    bedMinute: integer("bed_minute").notNull(),
    wakeMinute: integer("wake_minute").notNull(),
    minutesAsleep: integer("minutes_asleep"),
    mainSleep: boolean("main_sleep"),
    nap: boolean("nap").notNull().default(false),
    syncedAt: timestamp("synced_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("sleep_sessions_wake_date_idx").on(table.wakeDate)]
);

// Daily resting heart rate, HRV and the other overnight / fitness metrics from Google Health.
export const dailyHealth = pgTable("daily_health", {
  date: date("date", { mode: "string" }).primaryKey(),
  restingHr: real("resting_hr"),
  hrvMs: real("hrv_ms"),
  // Overnight SpO2 (% average), sleep respiratory rate (breaths/min), overnight skin temperature
  // relative to the user's baseline (deg C), mean heart rate in the 30 minutes before the main sleep
  // (bpm; keyed by wake date) and the Fitbit VO2 max estimate (mL/kg/min).
  spo2Pct: real("spo2_pct"),
  respRate: real("resp_rate"),
  skinTempDeltaC: real("skin_temp_delta_c"),
  preSleepHr: real("pre_sleep_hr"),
  vo2Max: real("vo2_max"),
  syncedAt: timestamp("synced_at", { withTimezone: true }).notNull().defaultNow(),
});

// The owner's myAir (ResMed CPAP) sign-in state for the myAir sync (one row, id 1). The username
// and password stay in env; this holds what Okta hands back. Never sent to the browser.
export const myairAuth = pgTable("myair_auth", {
  id: integer("id").primaryKey(),
  // Okta's remembered-device cookie: lets an account that uses emailed codes skip them.
  deviceToken: text("device_token"),
  accessToken: text("access_token"),
  idToken: text("id_token"),
  tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }),
  // A sign-in waiting for the emailed code.
  mfaStateToken: text("mfa_state_token"),
  mfaVerifyUrl: text("mfa_verify_url"),
  mfaSentAt: timestamp("mfa_sent_at", { withTimezone: true }),
  // The backfill has read every month from this one (YYYY-MM-01) to now; null until it starts.
  backfillFrom: date("backfill_from", { mode: "string" }),
  backfillEmptyMonths: integer("backfill_empty_months").notNull().default(0),
  backfillDone: boolean("backfill_done").notNull().default(false),
  // Which set of Google Health data types the scan has covered (SYNC_VERSION in lib/sleep.ts); a
  // lower value makes the next sync rescan all history.
  sleepSyncVersion: integer("sleep_sync_version").notNull().default(0),
  lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
  lastSync: jsonb("last_sync"),
});

// Nightly CPAP records from myAir, one per night (myAir's startDate).
export const cpapNights = pgTable("cpap_nights", {
  date: date("date", { mode: "string" }).primaryKey(),
  usageMinutes: integer("usage_minutes"),
  ahi: real("ahi"),
  leak: real("leak"),
  maskPairs: integer("mask_pairs"),
  score: integer("score"),
  syncedAt: timestamp("synced_at", { withTimezone: true }).notNull().defaultNow(),
});
