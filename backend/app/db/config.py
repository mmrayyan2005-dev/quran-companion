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

    # Auth settings. secret_key MUST be overridden via .env in any real
    # deployment — this default is only safe for local dev.
    secret_key: str = "dev-only-insecure-secret-change-me"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days
    jwt_algorithm: str = "HS256"

    # Comma-separated list of allowed frontend origins for CORS.
    # Defaults to local dev; production deployments override this via env
    # var to include the real deployed frontend URL(s) — this is why it's
    # not hardcoded in main.py, which would've broken the moment the
    # frontend moved off localhost.
    cors_allowed_origins: str = "http://localhost:5173"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_allowed_origins.split(",") if origin.strip()]


settings = Settings()
