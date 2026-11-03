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
    minutesInPeriod: integer("minutes_in_period"),
    mainSleep: boolean("main_sleep"),
    nap: boolean("nap").notNull().default(false),
    sleepType: text("sleep_type"),
    platform: text("platform"),
    device: text("device"),
    raw: jsonb("raw"),
    syncedAt: timestamp("synced_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("sleep_sessions_wake_date_idx").on(table.wakeDate)]
);

// Daily resting heart rate and HRV from Google Health.
export const dailyHealth = pgTable("daily_health", {
  date: date("date", { mode: "string" }).primaryKey(),
  restingHr: real("resting_hr"),
  hrvMs: real("hrv_ms"),
  syncedAt: timestamp("synced_at", { withTimezone: true }).notNull().defaultNow(),
});
