"""Settings for the backend, read from the environment or a .env file."""

from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """The Gemini API key and model name. Both can be set in .env or the environment."""
    model_config = SettingsConfigDict(env_file=".env")
    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.5-flash-lite"

# One shared instance, read once when the app starts.
settings = Settings()