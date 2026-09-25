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
- **Search**: the homepage filters biomarkers by name, category, group, or unit.
- **Navigation**: breadcrumb trails on every page and a loading skeleton during navigation.

## Access model

Anyone with the URL can view the site. Adding, editing, or deleting anything requires the app password. Click **Unlock editing** and enter it, and a cookie keeps you unlocked for 30 days. Every mutating server action calls `requireAuth()` (`src/lib/auth.ts`), so hiding the buttons in the UI is not the only protection.

## Stack

- [Next.js 16](https://nextjs.org) (App Router, Server Actions)
- [Neon Postgres](https://neon.tech) with [Drizzle ORM](https://orm.drizzle.team)
- [shadcn/ui](https://ui.shadcn.com) and Tailwind CSS v4
- [Recharts](https://recharts.org) for trend charts
- Deployed on [Vercel](https://vercel.com)

## Project layout

```
src/
  app/
    page.tsx                                   Homepage: Issues, search, group/category grid
    actions.ts                                 Server actions (all mutations)
    biomarkers/[id]/                           Biomarker detail: chart and readings table
    categories/[category]/                     Ungrouped category
    groups/[group]/                            Categories within a group
    groups/[group]/categories/[category]/      Biomarkers within a group's category
  components/                                  Cards, dialogs, trend chart, breadcrumbs
  db/schema.ts                                 Drizzle schema (biomarkers, readings)
  lib/
    auth.ts                                    Password cookie check
    status.ts                                  Range status and severity colors
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
   ```

   If the project is linked to Vercel, `vercel env pull .env.local` fills these in.

3. Start the dev server:

   ```bash
   npm run dev
   ```

   Then open http://localhost:3000.

## Database changes

The schema lives in `src/db/schema.ts`. There are no migration files. Changes are pushed directly:

```bash
npx dotenv -e .env.local -- npx drizzle-kit push
```

## Deployment

Pushing to `master` deploys to production through Vercel's GitHub integration.
