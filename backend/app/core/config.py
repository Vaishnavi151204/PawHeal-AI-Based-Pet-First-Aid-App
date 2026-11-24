from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Environment-backed application settings for the PawHeal FastAPI service."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "PawHeal AI Backend"
    app_version: str = "0.1.0"
    environment: str = Field(default="development")
    api_v1_prefix: str = Field(default="/api/v1")

    cors_origins: str = Field(default="http://localhost:3000,http://10.0.2.2:3000")

    gemini_api_key: str = Field(default="")
    gemini_model: str = Field(default="gemini-2.5-flash")
    gemini_timeout_seconds: int = Field(default=30, ge=5, le=120)

    supabase_url: str = Field(default="")
    supabase_jwt_secret: str = Field(default="")

    max_image_size_bytes: int = 5 * 1024 * 1024

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
