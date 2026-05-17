from pathlib import Path

from pydantic import computed_field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Mini Helpdesk API"
    app_env: str = "development"
    secret_key: str = "change-me-in-local-dev"
    access_token_expire_minutes: int = 60
    database_url: str = "postgresql+psycopg://helpdesk:helpdesk@localhost:5432/helpdesk"
    cors_origins: str = "http://localhost:5173"
    uploads_dir: str = "uploads"
    max_attachment_size_mb: int = 10

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @field_validator("database_url", mode="before")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        if not isinstance(value, str):
            return value

        if value.startswith("postgres://"):
            return value.replace("postgres://", "postgresql+psycopg://", 1)

        if value.startswith("postgresql://"):
            return value.replace("postgresql://", "postgresql+psycopg://", 1)

        return value

    @computed_field
    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @computed_field
    @property
    def backend_dir(self) -> Path:
        return Path(__file__).resolve().parents[1]

    @computed_field
    @property
    def uploads_dir_path(self) -> Path:
        uploads_path = Path(self.uploads_dir)
        if uploads_path.is_absolute():
            return uploads_path
        return self.backend_dir / uploads_path

    @computed_field
    @property
    def max_attachment_size_bytes(self) -> int:
        return self.max_attachment_size_mb * 1024 * 1024


settings = Settings()
