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
