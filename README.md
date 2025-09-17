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
   - `DATABASE_SSL` – set to `true` to force TLS (defaults to automatic Supabase detection)
   - `PORT` – optional HTTP port (defaults to `3000`)

2. **Install dependencies and run migrations**

   ```sh
   npm install
   npm run migrate
   ```

3. **Run the test suite** _(optional but recommended)_

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
DATABASE_SSL=false
```

Replace `user`, `password`, `host`, and `dbname` with your own PostgreSQL credentials.
You may also set `PORT` to choose the server's HTTP port (default: `3000`).

### Supabase smoke test

Use this quick checklist to verify connectivity against a Supabase-hosted database:

1. In Supabase, create a new project and copy the **connection string** from the **Project Settings → Database** page.
2. In `.env`, set `DATABASE_URL` to that string and add `DATABASE_SSL=true` (or leave it unset; Supabase URLs are auto-detected).
3. Run `npm install` (first time) and `npm run migrate` to create the required tables.
4. Start the API with `npm start` and confirm `Server listening on port …` appears without SSL errors.
5. Trigger a round-trip by sending a test request, e.g. `curl http://localhost:3000/api/patients` and expect an empty JSON array (`[]`).
6. Stop the server with `Ctrl+C` once verification is complete.

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

If no API is available, the sync logic silently skips network calls. The
analytics module first sends an `OPTIONS` request to check whether the
configured endpoint accepts writes and skips uploads when the server is not
reachable. To disable analytics entirely—for example when hosting on a static
site such as GitHub Pages—define `window.DISABLE_ANALYTICS = true` before
loading the scripts:

```html
<script>
  window.DISABLE_ANALYTICS = true;
</script>
```

## Google Drive export

Enable the **Upload to Drive** button to save summaries directly to Google Drive:

1. In [Google Cloud Console](https://console.cloud.google.com/) create an OAuth 2.0
   Client ID of type **Web application**.
2. Enable the Google Drive API and grant the scope
   `https://www.googleapis.com/auth/drive.file`.
3. Add your application's URL and `http://localhost` to the list of authorized
   origins.
4. Expose the client ID before loading the app:

   ```html
   <script>
     window.GOOGLE_CLIENT_ID = 'YOUR_CLIENT_ID';
   </script>
   ```

When the user clicks **Upload to Drive** the app requests authorization and
uploads the summary as a text file to their Drive account.

## Offline support

The app registers a Service Worker that caches the core HTML, CSS, JavaScript
and locale files so the interface continues to work offline after the first
load.

## Draft storage schema

Drafts saved to `localStorage` are wrapped in an object with a `version`
number. The current schema version is **1**, stored as
`{ version: 1, data: <payload> }`. Older drafts without a version are
automatically migrated when loaded.
