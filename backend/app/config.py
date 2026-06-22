from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "postgresql://postgres:postgres@db:5432/bookguess"
    redis_url: str = "redis://redis:6379"

    jwt_secret_key: str = "change-this-secret"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 10080  # 7 dias

    anthropic_api_key: str = ""

    max_upload_size_mb: int = 50
    hint_limit_free: int = 1
    hint_limit_premium: int = 3
    fuzzy_threshold: int = 85
    admin_username: str = "brayan"


settings = Settings()

