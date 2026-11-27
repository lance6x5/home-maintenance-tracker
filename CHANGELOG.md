# Changelog

All notable changes to Hearthkeep are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.3.0] - 2026-11-27

### Added
- LICENSE.md with the PolyForm Noncommercial License 1.0.0 and its `Required Notice` line.
- Studio credit in the footer ("A Silverlight DevTech project · © 2026 Silverlight DevTech") with the studio mark, a link to the license and a "More apps" link to the apps homepage (https://lance6x5.github.io/).
- Trademark note, License section and author/copyright meta tags; a "Licensing of contributions" note in CONTRIBUTING.md.

### Changed
- Hearthkeep is now licensed under the PolyForm Noncommercial License 1.0.0 (source-available; previous versions had no license). Commercial use requires a separate license from Silverlight DevTech.

## [1.2.0] - 2026-11-27

### Added
- Anonymous visit counter in the footer (e.g. "12,345 visits") via the open-source Abacus service: one count per browser session, skipped on localhost and when Do Not Track / Global Privacy Control is on, no cookies or app data, fails silently. The service worker never caches these requests.
- "Privacy & analytics" section and visits badge in the README.

### Changed
- Footer and README privacy wording now mention the anonymous visit count as the only outside request.

## [1.1.0] - 2026-11-27

### Added
- In-app feedback: "Report a bug" and "Request a feature" links in the footer open a pre-filled GitHub issue (app version and browser only, no task data) in a new tab.
- GitHub issue forms for bug reports and feature requests (auto-labelled `triage`), and a CONTRIBUTING.md describing the triage flow.

### Changed
- Logo wordmark now switches to light colors in dark mode so it stays readable (e.g. the README on GitHub dark theme).

## [1.0.0] - 2026-11-27

### Added
- Hearthkeep branding: original logo (home-with-hearth mark and wordmark), navy/ember/cream palette for light and dark mode, PNG and SVG PWA icons (192, 512, maskable).
- App version shown in the footer, with a link to this changelog.
- 11 built-in maintenance templates with one-tap quick add (or add all at once).
- Custom tasks with an interval (days/weeks/months/years) or fixed yearly dates, plus notes, supply info and season tags.
- "Mark done" with optional date and note, automatic next-due scheduling, and undo.
- Dashboard grouped into Overdue, Due this week and Upcoming, sorted by date, with red/amber/green states.
- Completion history for each task.
- Seasonal checklist for Spring, Summer, Fall and Winter.
- "Add to calendar" `.ics` export with RRULE recurrence, for one task or all tasks.
- Browser notifications on app open (permission is requested only after an explanation), plus best-effort Periodic Background Sync for installed PWAs.
- IndexedDB storage with a localStorage fallback, validated JSON export/import, and "Reset all data" with confirmation.
- Installable offline PWA, hash routing, and GitHub Pages deploy workflow.

### Changed
- Nothing yet (first release).

### Fixed
- Nothing yet (first release).

[Unreleased]: https://github.com/lance6x5/home-maintenance-tracker/compare/v1.3.0...HEAD
[1.3.0]: https://github.com/lance6x5/home-maintenance-tracker/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/lance6x5/home-maintenance-tracker/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/lance6x5/home-maintenance-tracker/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/lance6x5/home-maintenance-tracker/releases/tag/v1.0.0
