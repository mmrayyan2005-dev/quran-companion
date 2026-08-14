"""
Central configuration. All environment-dependent values live here —
no hardcoded connection strings or API keys scattered across the codebase
(this was a source of pain in the cricket project's pipeline.py).
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql://postgres:postgres@localhost:5432/quran_companion"
    quran_api_base_url: str = "https://api.quran.com/api/v4"
    environment: str = "development"


settings = Settings()
