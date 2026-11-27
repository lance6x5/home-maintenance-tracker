<p align="center"><img src="public/logo.svg" alt="Hearthkeep logo" width="480"></p>

# Hearthkeep

**Home care, season by season.** Hearthkeep is a home maintenance tracker (repo: `home-maintenance-tracker`).

Track recurring home maintenance tasks — furnace filters, detector tests, gutter cleaning and more — and see at a glance what's overdue, due this week, or coming up.

**Live app:** https://lance6x5.github.io/home-maintenance-tracker/

100% client-side: no backend, no accounts, no tracking. Your data is stored in your browser (IndexedDB).

## Features

- **11 built-in templates** you can enable with one tap: furnace filter (90 days), smoke/CO detector test (monthly), smoke detector batteries (yearly), gutter cleaning (spring & fall), water heater flush, dryer vent cleaning, HVAC service (yearly), weatherstripping check (fall), outdoor faucet winterizing (fall), sump pump test (spring), refrigerator coils (6 months).
- **Custom tasks** with an interval (days/weeks/months/years) or fixed yearly dates, notes, and supply info (e.g. filter size 16x25x1).
- **Mark done** logs the completion (with optional date and note) and schedules the next due date. Undo is available.
- **Dashboard** grouped into Overdue / Due this week / Upcoming, sorted by date, with red / amber / green states.
- **Completion history** per task.
- **Seasonal checklist** (Spring / Summer / Fall / Winter).
- **Add to calendar**: export one task or all tasks as `.ics` files with recurrence rules (RRULE).
- **Reminders** via browser notifications (see the honest caveats below).
- **Backup**: JSON export/import, plus "Reset all data" with confirmation.
- Installable **PWA** that works offline; light & dark mode; keyboard and screen-reader friendly.

## About reminders (please read)

This is a static site on GitHub Pages — there is **no push server**. That means:

- Notifications are only shown when you **open the app** (or the installed PWA). It checks for overdue and due-today tasks and notifies at most once per day.
- On Chromium browsers with the app **installed**, it also registers a Periodic Background Sync check. The browser decides if and when that runs (often roughly daily, and only for apps you use regularly). It is best effort, not guaranteed.
- Notification permission is only requested after you click **Settings → Turn on notifications** and read the explanation — never on page load.
- **For reliable reminders, use "Add to calendar"**. The `.ics` file contains a repeating event, so your calendar app (Google, Apple, Outlook) reminds you on schedule even if you never open this app. Re-export after big schedule changes.

## Local development

```bash
npm install
npm run dev      # start dev server
npm test         # run unit tests (Vitest)
npm run build    # production build to dist/
npm run preview  # preview the production build
```

Requires Node 20+ (CI uses Node 22).

## Deploy (GitHub Pages)

1. Push this repo to GitHub on the `main` branch.
2. One-time setup: **Repo Settings → Pages → Source: "GitHub Actions"**.
3. Every push to `main` (or a manual run of the workflow) runs `.github/workflows/deploy.yml`, which installs, tests, builds and deploys `dist/` to Pages.

The Vite `base` is set to `/home-maintenance-tracker/` in `vite.config.js`. If you rename the repo, update `BASE` there.

## Versioning

Hearthkeep follows [Semantic Versioning](https://semver.org/). The current version is in `package.json`, shown in the app footer, and every release is listed in [CHANGELOG.md](CHANGELOG.md) (Keep a Changelog format) with a matching git tag and GitHub release.

- **MAJOR**: breaking change to stored data or the export/import schema.
- **MINOR**: new features that keep existing data compatible.
- **PATCH**: bug fixes and small tweaks.

To release: update `version` in `package.json`, move the Unreleased notes into a dated section in `CHANGELOG.md`, commit, push, then `git tag -a vX.Y.Z -m "Hearthkeep vX.Y.Z"` and `git push origin vX.Y.Z`, and create a GitHub release from that changelog section.

## Project structure

```
src/
  main.jsx, App.jsx      App entry, shell and hash routing (#/, #/seasonal, #/tasks, #/task/:id, #/settings)
  hooks.js               Hash router + IndexedDB-backed task store (React context)
  lib/dates.js           Time-zone-safe YYYY-MM-DD date math
  lib/schedule.js        Next-due calculation, status, grouping, seasons
  lib/tasks.js           Pure task operations (create, mark done, undo, edit)
  lib/templates.js       Built-in task templates
  lib/ics.js             iCalendar export with RRULE
  lib/backup.js          JSON export/import + validation
  lib/db.js              IndexedDB wrapper (localStorage fallback)
  lib/notify.js          Notification + Periodic Background Sync helpers
  views/, components/    UI
public/logo.svg, icon*   Logo, favicon and PWA icons
public/reminder-sw.js    Service-worker handlers (periodic check, notification click)
tests/                   Vitest unit tests
```

## Data format

Exports are JSON: `{ "app": "home-maintenance-tracker", "version": 1, "exportedAt": "...", "tasks": [...] }`. Imports are validated; invalid entries are skipped, and importing replaces current data.
