# Stroke Team App

A lightweight web application for stroke teams to quickly record and
track critical information during patient treatment. The interface is
optimized for rapid data entry, offers built‑in calculators and summaries,
and stores drafts locally so it can be used offline.

## Getting started

Requires Node.js 20 or later.

Install dependencies and run the tests:

```sh
npm install
npm test
```

To build optimized assets run:

```sh
npm run build
```

## Database migrations

Set the `DATABASE_URL` environment variable and run migrations with:

```sh
npm run migrate
```

## Real-time collaboration

The app ships with a small WebSocket server that syncs form data between browsers.

### Starting the server

```sh
npm start
```

By default the server listens on `ws://localhost:3000/ws`. Set the `PORT` environment variable to use a different port:

```sh
PORT=4000 npm start
```

Leave the server running while using the app.

### Joining a collaboration room

1. Open `index.html` in a browser.
2. Click the **Collaborate** button in the header.
3. Enter a room ID and press **Join**. All clients that join the same room receive real-time updates.

### Troubleshooting

* Ensure the WebSocket server is running and the port matches the one used by the frontend.
* Firewalls or corporate networks may block WebSocket connections; try a different network if you cannot connect.
* When served over HTTPS the app uses `wss://`; if the server only provides `ws://`, run it behind an HTTPS proxy or access the app over HTTP.
* Check the browser console for additional error details.

## Offline support

The app registers a Service Worker that caches the core HTML, CSS, JavaScript
and locale files so the interface continues to work offline after the first
load.

## Draft storage schema

Drafts saved to `localStorage` are wrapped in an object with a `version`
number. The current schema version is **1**, stored as
`{ version: 1, data: <payload> }`. Older drafts without a version are
automatically migrated when loaded.
