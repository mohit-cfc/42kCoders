from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/dhundho"
    SARVAM_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    ALLOWED_ORIGINS: str = "*"

    MAX_RESULTS: int = 5
    DEFAULT_RADIUS_KM: float = 2.0

    # Sarvam AI — see https://docs.sarvam.ai
    SARVAM_BASE_URL: str = "https://api.sarvam.ai"
    SARVAM_STT_MODEL: str = "saarika:v2.5"
    SARVAM_CHAT_MODEL: str = "sarvam-m"
    SARVAM_TIMEOUT_S: float = 15.0


settings = Settings()
