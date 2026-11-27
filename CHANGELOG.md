# Changelog

All notable changes to Hearthkeep are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/lance6x5/home-maintenance-tracker/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/lance6x5/home-maintenance-tracker/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/lance6x5/home-maintenance-tracker/releases/tag/v1.0.0
