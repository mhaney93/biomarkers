# Biomarkers

A personal web app for logging lab results and health metrics over time and seeing how they trend.

**Live:** https://biomarkers-kappa.vercel.app

## Features

- **Biomarkers and readings**: track any metric with a unit and reference range, then log dated readings with optional notes.
- **Three value types**:
  - **Number**: a value with a unit and a low/high reference range, shown with a trend chart and a status badge.
  - **Duration (h:m)**: for time-based metrics such as glucose spike duration. Stored as total minutes and displayed as `h:mm`.
  - **Text**: freeform notes. No unit, range, or chart.
- **Groups and categories**: biomarkers can sit in a category, and categories can be nested under a group (for example, a "Baseline Test" panel split into Blood, Heart, Kidney, and so on). Categories and groups can be renamed in one step.
- **Issues section**: the homepage lists every biomarker whose latest reading is out of range, worst first.
- **Severity colors**: out-of-range badges shade from yellow to red according to how far past the range they are, relative to the worst value across the site.
- **Allergy classes**: allergen-specific IgE results (unit `kU/L`, name ending in `IgE`) show the lab's 0–6 allergy class instead of a percent. Their severity color follows that class.
- **Search**: the homepage filters biomarkers by name, category, group, or unit.
- **Navigation**: breadcrumb trails on every page and a loading skeleton during navigation.
- **Sleep sync**: the Sleep category pulls nightly sleep, daily resting heart rate and HRV from the Google Health API (read-only) and publishes each completed month's averages: sleep duration, consistency, bedtime, wake time, resting heart rate and HRV. See [Sleep sync](#sleep-sync).

## Access model

Anyone with the URL can view the site. Adding, editing, or deleting anything requires the app password. Click **Unlock editing** and enter it, and a cookie keeps you unlocked for 30 days. Every mutating server action calls `requireAuth()` (`src/lib/auth.ts`), so hiding the buttons in the UI is not the only protection.

## Sleep sync

- **Connect**: unlock editing, open the Sleep category, and click **Connect Google** (or **Reconnect Google**). The connect and callback routes (`src/app/api/google/`) refuse anyone without the password cookie, and the refresh token is kept server-side in the `google_auth` table.
- **Backfill**: after connecting, the page runs **Sync now** until it has read every night Google has, a year per call so each call stays inside the function time limit (`sleep_synced_to` is the resumable cursor).
- **Daily**: a Vercel cron (`vercel.json`) calls `/api/cron/sleep`, which rereads the last 3 days and publishes any completed month (Pacific time) still missing a value. The route only runs with Vercel's `Authorization: Bearer $CRON_SECRET`.
- **Rules**: readings are dated the last day of the month. A month that already has a value is never overwritten; a different value is listed on the Sleep page instead. Publishing is held while the computed sleep duration disagrees with the hand-entered months (median gap over 10 min). Definitions are in `src/lib/sleep.ts`.

## Stack

- [Next.js 16](https://nextjs.org) (App Router, Server Actions)
- [Neon Postgres](https://neon.tech) with [Drizzle ORM](https://orm.drizzle.team)
- [shadcn/ui](https://ui.shadcn.com) and Tailwind CSS v4
- [Recharts](https://recharts.org) for trend charts
- Deployed on [Vercel](https://vercel.com)

## Project layout

```
scripts/                                       Idempotent lab-report imports into the live DB
src/
  app/
    page.tsx                                   Homepage: Issues, search, group/category grid
    actions.ts                                 Server actions (all mutations)
    biomarkers/[id]/                           Biomarker detail: chart and readings table
    categories/[category]/                     Ungrouped category
    groups/[group]/                            Categories within a group
    groups/[group]/categories/[category]/      Biomarkers within a group's category
  components/                                  Cards, dialogs, trend chart, breadcrumbs
  db/schema.ts                                 Drizzle schema (biomarkers, readings, sleep sync tables)
  lib/
    auth.ts                                    Password cookie check
    sleep.ts, sleep-sync.ts, google.ts         Sleep sync: monthly definitions, DB sync, Google client
    status.ts                                  Range status, severity colors, allergen classes
    duration.ts                                h:m formatting
```

## Local development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` with:

   ```
   DATABASE_URL=postgres://...
   APP_PASSWORD=...
   # Sleep sync (optional)
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   CRON_SECRET=...
   ```

   If the project is linked to Vercel, `vercel env pull .env.local` fills these in.

3. Start the dev server:

   ```bash
   npm run dev
   ```

   Then open http://localhost:3000.

4. Run the tests:

   ```bash
   npm test
   ```

## Database changes

The schema lives in `src/db/schema.ts`. There are no migration files. Changes are pushed directly:

```bash
npx dotenv -e .env.local -- npx drizzle-kit push
```

## Deployment

Pushing to `master` deploys to production through Vercel's GitHub integration.
