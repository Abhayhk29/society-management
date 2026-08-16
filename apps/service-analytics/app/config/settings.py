import os
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

SERVICE_ROOT = Path(__file__).resolve().parents[2]


def _env_file() -> Path:
    if os.getenv("ENVIRONMENT") == "test":
        return SERVICE_ROOT / ".env.test"
    return SERVICE_ROOT / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_env_file(),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    port: int = 3004
    host: str = "0.0.0.0"


@lru_cache
def get_settings() -> Settings:
    return Settings()
