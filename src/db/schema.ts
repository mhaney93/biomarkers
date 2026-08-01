import { pgTable, uuid, text, numeric, date, timestamp, index } from "drizzle-orm/pg-core";

export const biomarkers = pgTable("biomarkers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  unit: text("unit").notNull(),
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
    value: numeric("value").notNull(),
    takenAt: date("taken_at").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("readings_biomarker_id_idx").on(table.biomarkerId)]
);
