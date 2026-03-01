from functools import lru_cache
import os

from pydantic import BaseModel


class Settings(BaseModel):
    app_name: str = "tripify-ai-service"
    model_name: str = os.getenv("TRIPIFY_LLM_MODEL", "llama3.2:3b")
    ollama_base_url: str = os.getenv("TRIPIFY_OLLAMA_BASE_URL", "http://localhost:11434")
    request_timeout_seconds: float = float(os.getenv("TRIPIFY_LLM_TIMEOUT_SECONDS", "60"))
    default_currency: str = os.getenv("TRIPIFY_DEFAULT_CURRENCY", "USD")
    default_host: str = os.getenv("TRIPIFY_AI_HOST", "0.0.0.0")
    default_port: int = int(os.getenv("TRIPIFY_AI_PORT", "8001"))


@lru_cache
def get_settings() -> Settings:
    return Settings()
