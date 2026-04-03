"""App configuration loaded from environment variables."""

import os
from pathlib import Path

from dotenv import load_dotenv

_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_env_path)


class Config:
    """Base configuration."""

    SECRET_KEY = os.getenv("FLASK_SECRET_KEY", "dev-secret-key")
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///andatra.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    APP_HOST = os.getenv("APP_HOST", "0.0.0.0")
    APP_PORT = int(os.getenv("APP_PORT", "5000"))
    FLASK_DEBUG = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    AUTO_SEED_REFERENCE_DATA = os.getenv("AUTO_SEED_REFERENCE_DATA", "true").lower() == "true"

    _default_cors_origins = ",".join(
        [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:8081",
            "http://127.0.0.1:8081",
            "http://localhost:19006",
            "http://127.0.0.1:19006",
        ]
    )
    CORS_ORIGINS = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", _default_cors_origins).split(",")
        if origin.strip()
    ]
    SOCKETIO_ASYNC_MODE = os.getenv("SOCKETIO_ASYNC_MODE", "threading")

    # LLM Ollama endpoints
    LLM_PRIMARY_URL = os.getenv("LLM_PRIMARY_URL", "http://localhost:11434")
    LLM_CLASSIFY_URL = os.getenv("LLM_CLASSIFY_URL", "http://localhost:11434")
    LLM_VISION_URL = os.getenv("LLM_VISION_URL", "http://localhost:11434")
    LLM_PRIMARY_MODEL = os.getenv("LLM_PRIMARY_MODEL", "llama3")
    LLM_CLASSIFY_MODEL = os.getenv("LLM_CLASSIFY_MODEL", "mistral")
    LLM_VISION_MODEL = os.getenv("LLM_VISION_MODEL", "llava")
    LLM_VISION_ENABLED = os.getenv("LLM_VISION_ENABLED", "true").lower() == "true"
    LLM_MODEL_RESOLUTION_TIMEOUT = float(os.getenv("LLM_MODEL_RESOLUTION_TIMEOUT", "2"))
    LLM_PRIMARY_TIMEOUT = float(os.getenv("LLM_PRIMARY_TIMEOUT", "45"))
    LLM_CLASSIFY_TIMEOUT = float(os.getenv("LLM_CLASSIFY_TIMEOUT", "15"))
    LLM_INTAKE_TIMEOUT = float(os.getenv("LLM_INTAKE_TIMEOUT", "10"))
    LLM_VISION_TIMEOUT = float(os.getenv("LLM_VISION_TIMEOUT", "10"))

    # Mock mode for development without GPU/Ollama
    LLM_MOCK_MODE = os.getenv("LLM_MOCK_MODE", "false").lower() == "true"
    
    # Optional Gemini Fallback
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

    # Reverse geocoding for location enrichment
    GEOCODING_ENABLED = os.getenv("GEOCODING_ENABLED", "true").lower() == "true"
    GEOCODING_REVERSE_URL = os.getenv(
        "GEOCODING_REVERSE_URL",
        "https://nominatim.openstreetmap.org/reverse",
    )
    GEOCODING_USER_AGENT = os.getenv("GEOCODING_USER_AGENT", "AndATRA/1.0")
    GEOCODING_TIMEOUT = float(os.getenv("GEOCODING_TIMEOUT", "6"))

    # Telegram bot shared secret
    TELEGRAM_BOT_SECRET = os.getenv("TELEGRAM_BOT_SECRET", "shared_secret_token_here")


class TestConfig(Config):
    """Test configuration with in-memory SQLite."""

    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    LLM_MOCK_MODE = True
    LLM_VISION_ENABLED = True
    TELEGRAM_BOT_SECRET = "test_secret"
