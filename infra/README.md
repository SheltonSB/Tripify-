# Infrastructure

This repository currently ships with a complete local development stack built around Docker Compose.

Services:
- PostgreSQL 16 on `localhost:5432`
- Redis 7 on `localhost:6379`
- FastAPI backend on `localhost:8000`

What lives here:
- `postgres/init/001_extensions.sql`: bootstrap SQL executed automatically on first database creation

Run the stack:

```bash
docker compose up --build
```

Useful checks:

```bash
docker compose ps
curl http://localhost:8000/health
```

Stop the stack:

```bash
docker compose down
```

Reset local database state:

```bash
docker compose down -v
```
