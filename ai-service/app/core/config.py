from functools import lru_cache
import os

from pydantic import BaseModel


class Settings(BaseModel):
    app_name: str = "tripify-ai-service"
    model_name: str = os.getenv("TRIPIFY_LLM_MODEL", "llama3")
    default_currency: str = os.getenv("TRIPIFY_DEFAULT_CURRENCY", "USD")
    default_host: str = os.getenv("TRIPIFY_AI_HOST", "0.0.0.0")
    default_port: int = int(os.getenv("TRIPIFY_AI_PORT", "8001"))


@lru_cache
def get_settings() -> Settings:
    return Settings()
