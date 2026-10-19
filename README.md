# Spendwise — Expense Tracker

A personal expense tracker built with Next.js 14 (App Router), TypeScript and Tailwind CSS. All data is stored in your browser's `localStorage`.

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000
# or a production build:
npm run build && npm start
```

Requires Node.js 18.17+.

## Features

- **Dashboard**: total, this-month (vs. last month), top category and daily-average cards; 6-month bar chart with an average line; donut breakdowns for this month and all time; recent expenses
- **Add / edit**: a modal form with inline validation (positive amount, max 2 decimals, no future dates, required category and description) and a native date picker
- **Expenses list**: search, category filter, date-range presets plus custom From/To dates, sorting, and "show more" paging
- **Delete with undo**: a confirmation dialog, then an Undo button in the toast; "Clear all" can be undone too
- **Share & Export center** (`/export`), with a cloud sync indicator and background-jobs tray in the navbar:
  - **Templates**: Full Backup (JSON), Monthly Summary (Markdown), Tax Report (CSV), Category Analysis (CSV), each with a preview
  - **Share links and QR codes**: a compressed snapshot stored in the link itself (after `#`), opened at `/share`, with optional expiry and "Import into my Spendwise"
  - **Integrations**: Google Drive, Dropbox, OneDrive, Google Sheets, Slack and email, with auto-sync and sync status
  - **Schedules**: daily, weekly or monthly exports, with a calendar (`.ics`) reminder
  - **History**: every export, sync and share, with filters and re-download
  - **Suggestions** on the overview, such as a backup reminder or month-end report

  **What's real vs. simulated:** downloads, share links, QR codes, webhooks (real HTTP POST), "paste into Sheets", Markdown copy, `mailto:` and calendar files all work. Drive, Dropbox, OneDrive, Sheets connect, Slack and email *sending* are labelled **Simulated**: the flow, history and sync status behave like the real thing, but no data leaves the browser, because this demo has no backend. Schedules run while the app is open in a tab, and missed runs catch up on the next visit.
- **Sample data**: a one-click load of about 6 months of realistic expenses from the empty dashboard
- Loading skeletons, error states, toasts, a responsive layout (table on desktop, cards and a bottom-sheet form on mobile), and multi-tab sync

## Project structure

```
src/
  app/            routes: / (dashboard), /expenses, layout, error and 404 pages
  components/     UI: charts, table, filters, modal, form dialog, states
  components/cloud/  Export Center tabs, dialogs, sync indicator, shared-link viewer
  hooks/          React context state: expenses, toasts, expense dialog, cloud (connections, schedules, history, jobs)
  lib/            pure logic: analytics, validation, storage, formatting
  lib/cloud/      export templates, share-link encoding, schedules, .ics, service catalog
  types/          shared types and categories
```
