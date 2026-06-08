from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    github_pat: str
    shield_master_key: str = "dev-master-key"
    port: int = 8000

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )

settings = Settings()