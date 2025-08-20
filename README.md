# Stroke Team App

A lightweight web application for stroke teams to quickly record and
track critical information during patient treatment. The interface is
optimized for rapid data entry, offers built‑in calculators and summaries,
and stores drafts locally so it can be used offline.

## Getting started

Install dependencies and run the tests:

```sh
npm install
npm test
```

To build optimized assets run:

```sh
npm run build
```

Open `index.html` in a browser to use the app.

## Draft storage schema

Drafts saved to `localStorage` are wrapped in an object with a `version`
number. The current schema version is **1**, stored as
`{ version: 1, data: <payload> }`. Older drafts without a version are
automatically migrated when loaded.
