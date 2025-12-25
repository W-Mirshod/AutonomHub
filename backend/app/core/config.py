from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    KLING_API_KEY: str | None = None
    RUNWAY_API_KEY: str | None = None
    OPENAI_API_KEY: str | None = None

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
