import os

from fastapi import FastAPI


REQUIRED_ENV_VARS = ("DATABASE_URL", "REDIS_URL")

app = FastAPI(title="Tripify API")


def get_missing_env_vars() -> list[str]:
    return [name for name in REQUIRED_ENV_VARS if not os.getenv(name)]


@app.get("/")
def read_root() -> dict[str, str]:
    return {"service": "tripify-api", "status": "running"}


@app.get("/health")
def read_health() -> dict[str, object]:
    missing = get_missing_env_vars()
    return {
        "status": "ok" if not missing else "degraded",
        "database_url_configured": "DATABASE_URL" not in missing,
        "redis_url_configured": "REDIS_URL" not in missing,
        "missing_env_vars": missing,
    }
