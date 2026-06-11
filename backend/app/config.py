from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    github_pat: str
    shield_master_key: str = "dev-master-key"
    port: int = 8000
    upstash_redis_rest_url: str = ""
    upstash_redis_rest_token: str = ""
    cache_similarity_threshold: float = 0.92
    cache_ttl_seconds: int = 86400

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )

settings = Settings()