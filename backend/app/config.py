from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")
    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.5-flash-lite"

settings = Settings()