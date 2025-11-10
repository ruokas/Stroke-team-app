# Repository Guidelines
The Stroke Team App is optimized for offline-first patient intake; follow these notes to keep contributions aligned.

## Project Structure & Module Organization
- `js/` holds ES modules for UI logic (analytics, forms, calculators); keep new modules feature-scoped.
- `css/` stores PostCSS sources (`layout.css`, `components.css`, `forms.css`); build output is `css/style.css`.
- `templates/` contains Nunjucks views (`layout.njk`, `partials/`, `sections/`) rendered by `build.js`.
- `server/` exposes the Express API, Knex config, and migrations; `index.js` is the entry point.
- `supabase/` mirrors the API via Edge Functions for serverless deployments.
- `test/` includes Node test suites (`*.test.js`) plus `jsdomSetup.js`.
- `docs/` and `docs/postgres.md` explain database and deployment expectations.

## Build, Test, and Development Commands
- `npm start`: run the Express API against the configured PostgreSQL instance on `http://localhost:3000`.
- `npm run migrate`: apply Knex migrations using `server/knexfile.js`; rerun after schema changes.
- `npm run build`: render Nunjucks templates, minify CSS, and copy PWA assets (`manifest.json`, `sw.js`).
- `npm test`: execute the Node test suite (jsdom + in-memory DB stubs); run before every push.
- `npm run lint` / `npm run format`: enforce ESLint and Prettier settings; Husky triggers them on commits via lint-staged.

## Coding Style & Naming Conventions
Use Prettier defaults (two-space indentation, single quotes, trailing commas) and ES modules. Name files in `js/` with camelCase that mirrors the exported function (e.g., `bpMeds.js`). Prefer descriptive function names and keep templates organized under existing sections. Update `css` entries via custom properties instead of ad-hoc hex values.

## Testing Guidelines
Place new unit tests under `test/` with the `<feature>.test.js` pattern and import shared setup from `test/jsdomSetup.js`. Aim to cover edge cases around offline persistence, API synchronization, and validation logic. Integration tests that touch the database should set `NODE_ENV=test` so the in-memory pool is used. Add regression tests whenever modifying calculators or synchronization flows.

## Commit & Pull Request Guidelines
Write commits in the imperative mood (`Add`, `Fix`, `Update`), referencing related issues or Supabase tickets when relevant. Keep commits focused and include migrations, template changes, and locale updates in the same PR for traceability. Pull requests should describe motivation, summarize user-visible changes, list `npm test`/`npm run build` results, and attach screenshots or curl samples for UI or API updates. Request review for security-affecting `.env` changes.

## Configuration & Security Tips
Manage secrets through `.env`; never check credentials into Git. Populate `DATABASE_URL` and `DATABASE_SSL` before running migrations. When deploying statically, set `API_BASE`, `SUPABASE_PROJECT_URL`, and `SUPABASE_ANONPUBLIC` so `build.js` embeds the correct runtime values. Review `.env.production` and GitHub Pages settings before enabling analytics or external services.
