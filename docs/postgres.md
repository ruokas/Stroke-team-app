# PostgreSQL Setup

This project uses PostgreSQL for persistence. The backend reads the connection
string from the `DATABASE_URL` environment variable.

## Using Docker Compose

The easiest way to run PostgreSQL locally is via Docker Compose. Create a
`docker-compose.yml` file in the project root with the following contents:

```yaml
db:
  image: postgres:15
  restart: unless-stopped
  environment:
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: postgres
    POSTGRES_DB: stroke
  ports:
    - "5432:5432"
  volumes:
    - db-data:/var/lib/postgresql/data

volumes:
  db-data:
```

Start the database:

```sh
docker compose up -d
```

Configure `.env` to point at the running container:

```
DATABASE_URL=postgres://postgres:postgres@localhost:5432/stroke
DATABASE_SSL=false
```

Run migrations to create the required tables:

```sh
npm run migrate
```

When finished, stop the container with:

```sh
docker compose down
```

## Using Supabase

Supabase offers managed PostgreSQL instances that work with the same
connection string format:

1. In the Supabase dashboard, open **Project Settings → Database** and copy
   the **Connection string** in `URI` format. It will look similar to
   `postgresql://USER:PASSWORD@db.<project>.supabase.co:5432/postgres?sslmode=require`.
2. Update your `.env` file so `DATABASE_URL` matches the Supabase string. Keep
   `sslmode=require` on the URL or set `DATABASE_SSL=true` to force TLS when
   the URL omits explicit parameters.
3. Install dependencies if you have not already and run the migrations against
   the Supabase database:

   ```sh
   npm install
   npm run migrate
   ```

The migration script auto-detects the TLS settings, so no additional flags are
required beyond the connection string.

## Supabase SQL editor: patients & events tables

Run the following statements in the Supabase SQL editor to create the
`patients` and `events` tables together with Row Level Security policies that
restrict direct access to trusted service tokens (for example, Edge functions
using the `service_role` key or a function-scoped JWT). The policies grant full
read/write access only when the caller is authenticated with the `service_role`
role, so regular client-side `supabase-js` instances will not see these rows by
default.

```sql
-- Table definitions
create table if not exists public.patients (
  patient_id text primary key,
  name text,
  payload jsonb,
  created timestamptz default now(),
  last_updated timestamptz default now()
);

create table if not exists public.events (
  id bigint generated always as identity primary key,
  event text,
  payload jsonb,
  ts timestamptz default now()
);

-- Ensure RLS is on before adding policies
alter table public.patients enable row level security;
alter table public.events enable row level security;

-- Allow only trusted service tokens (Edge functions, background jobs)
create policy "Patients managed by service role" on public.patients
  for all using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "Events managed by service role" on public.events
  for all using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
```

### Planning for browser access later

If you later introduce `supabase-js` in the browser, create separate policies
that scope rows to individual users. A common pattern is to add an owner column
(`created_by uuid default auth.uid()`) and then create per-table policies such
as:

```sql
create policy "Patients accessible to their owner" on public.patients
  for select using (created_by = auth.uid());
```

Keep the service-role policies in place for Edge functions or other privileged
workflows, and avoid exposing the service-role key to the browser.
