from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[2]
DEFAULT_SQLITE_URL = f"sqlite:///{(BASE_DIR / 'sams.db').as_posix()}"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')

    database_url: str = DEFAULT_SQLITE_URL
    secret_key: str = 'change-this-in-production'
    algorithm: str = 'HS256'
    access_token_expire_minutes: int = 120
    allowed_origins: str = 'http://localhost:4200,http://localhost:4201,http://127.0.0.1:4200,http://127.0.0.1:4201'
    datagov_api_key: str = '579b464db66ec23bdd000001'
    news_api_key: str = 'YOUR_API_KEY'
    datagov_schemes_resource: str = '14d8c1f8-4f4f-4c2e-9a2a-xxxxxxx'
    gemini_api_key: str = ''
    gemini_model: str = 'gemini-1.5-flash'


settings = Settings()
