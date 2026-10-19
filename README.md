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
- **CSV export**: exports whatever the current filters show (Excel-friendly UTF-8, guarded against formula injection)
- **Sample data**: a one-click load of about 6 months of realistic expenses from the empty dashboard
- Loading skeletons, error states, toasts, a responsive layout (table on desktop, cards and a bottom-sheet form on mobile), and multi-tab sync

## Project structure

```
src/
  app/            routes: / (dashboard), /expenses, layout, error and 404 pages
  components/     UI: charts, table, filters, modal, form dialog, states
  hooks/          React context state: expenses, toasts, expense dialog
  lib/            pure logic: analytics, validation, csv, storage, formatting
  types/          shared types and categories
```
