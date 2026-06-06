from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/dhundho"

    @field_validator("DATABASE_URL")
    @classmethod
    def _force_asyncpg_driver(cls, v: str) -> str:
        # Railway (and most managed Postgres) expose `postgres://` / `postgresql://`.
        # The async stack requires the asyncpg driver — normalize the scheme here so
        # both the app engine and Alembic get a usable URL without per-env juggling.
        if v.startswith("postgres://"):
            v = "postgresql://" + v[len("postgres://"):]
        if v.startswith("postgresql://"):
            v = "postgresql+asyncpg://" + v[len("postgresql://"):]
        return v
    SARVAM_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    ALLOWED_ORIGINS: str = "*"

    MAX_RESULTS: int = 5
    DEFAULT_RADIUS_KM: float = 2.0

    # Sarvam AI — see https://docs.sarvam.ai
    SARVAM_BASE_URL: str = "https://api.sarvam.ai"
    SARVAM_STT_MODEL: str = "saarika:v2.5"
    SARVAM_CHAT_MODEL: str = "sarvam-30b"  # valid: sarvam-30b | sarvam-105b (NOT sarvam-m)
    SARVAM_TIMEOUT_S: float = 15.0

    # Gemini Flash — fallback for intent extraction when Sarvam fails/quota-exceeded.
    GEMINI_BASE_URL: str = "https://generativelanguage.googleapis.com"
    GEMINI_MODEL: str = "gemini-2.0-flash"

settings = Settings()
