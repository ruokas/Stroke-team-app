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
