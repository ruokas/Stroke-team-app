# Stroke Team App

A lightweight web application for stroke teams to quickly record and
track critical information during patient treatment. The interface is
optimized for rapid data entry, offers built‑in calculators and summaries,
and stores drafts locally so it can be used offline.

## Getting started

Requires Node.js 20 or later and access to a PostgreSQL database.

1. **Configure environment variables**

   Copy the example file and update it with your database connection string (and optionally the port the server should listen on):

   ```sh
   cp .env.example .env
   # edit .env
   ```

   - `DATABASE_URL` – PostgreSQL connection string
   - `PORT` – optional HTTP port (defaults to `3000`)

2. **Install dependencies and run migrations**

   ```sh
   npm install
   npm run migrate
   ```

3. **Run the test suite** *(optional but recommended)*

   ```sh
   npm test
   ```

4. **Start the backend server**

   ```sh
   npm start
   ```

   The API is now available at `http://localhost:3000`.
   Patient endpoints are namespaced under `/api`; use `/api/patients` for
   patient data. Requests to `/patients` without the `/api` prefix will be
   redirected to the correct path.

To build optimized assets run:

```sh
npm run build
```

For additional database setup details and using Docker Compose for a local PostgreSQL instance, see [docs/postgres.md](docs/postgres.md).

## Database setup

Create a `.env` file in the project root with your database connection string:

```sh
DATABASE_URL=postgres://user:password@host:5432/dbname
```

Replace `user`, `password`, `host`, and `dbname` with your own PostgreSQL credentials.  
You may also set `PORT` to choose the server's HTTP port (default: `3000`).

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

## Client synchronization

The browser stores patient records in `localStorage` so the app works offline.
When connectivity is available the client:

1. Sends any unsynced patients to `POST /api/patients`.
2. Fetches the latest records from `GET /api/patients`.

This happens automatically when the page goes online and can also be triggered
manually via the **Sync** button. Keep the backend server running so changes
are persisted to the database.

### Configuring the API base URL

By default the frontend sends requests to `/api`. This base URL is used for
both patient synchronization and analytics event uploads. When deploying the
app in an environment where the API lives elsewhere, set the base URL either by
defining `window.API_BASE` before loading the scripts or via the `API_BASE`
environment variable at build time:

```html
<script>
  window.API_BASE = 'https://example.com/api';
</script>
```

```sh
API_BASE=https://example.com/api npm run build
```

If no API is available, the sync logic silently skips network calls.

## Offline support

The app registers a Service Worker that caches the core HTML, CSS, JavaScript
and locale files so the interface continues to work offline after the first
load.

## Draft storage schema

Drafts saved to `localStorage` are wrapped in an object with a `version`
number. The current schema version is **1**, stored as
`{ version: 1, data: <payload> }`. Older drafts without a version are
automatically migrated when loaded.
