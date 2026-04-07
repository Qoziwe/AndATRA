"""App configuration loaded from environment variables."""

import os
from pathlib import Path

from dotenv import load_dotenv
from app.database import DEFAULT_DATABASE_URL, build_engine_options, normalize_database_url

_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_env_path)


class Config:
    """Base configuration."""

    APP_ENV = (os.getenv("APP_ENV") or os.getenv("FLASK_ENV", "development")).strip().lower()
    IS_PRODUCTION = APP_ENV == "production"
    SECRET_KEY = os.getenv("FLASK_SECRET_KEY", "dev-secret-key")
    SQLALCHEMY_DATABASE_URI = normalize_database_url(
        os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL)
    )
    SQLALCHEMY_ENGINE_OPTIONS = build_engine_options(SQLALCHEMY_DATABASE_URI)
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    APP_HOST = os.getenv("APP_HOST", "0.0.0.0")
    APP_PORT = int(os.getenv("PORT") or os.getenv("APP_PORT", "5000"))
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
    SOCKETIO_ASYNC_MODE = os.getenv(
        "SOCKETIO_ASYNC_MODE",
        "eventlet" if IS_PRODUCTION else "threading",
    )

    # LLM Ollama endpoints
    LLM_PRIMARY_URL = os.getenv("LLM_PRIMARY_URL", "http://localhost:11434")
    LLM_CLASSIFY_URL = os.getenv("LLM_CLASSIFY_URL", "http://localhost:11434")
    LLM_VISION_URL = os.getenv("LLM_VISION_URL", "http://localhost:11434")
    LLM_PRIMARY_MODEL = os.getenv("LLM_PRIMARY_MODEL", "llama3")
    LLM_CLASSIFY_MODEL = os.getenv("LLM_CLASSIFY_MODEL", "mistral")
    LLM_VISION_MODEL = os.getenv("LLM_VISION_MODEL", "llava")
    ENABLE_LLM = os.getenv("ENABLE_LLM", "true").lower() == "true"
    LLM_MODEL_RESOLUTION_TIMEOUT = float(os.getenv("LLM_MODEL_RESOLUTION_TIMEOUT", "2"))
    LLM_PRIMARY_TIMEOUT = float(os.getenv("LLM_PRIMARY_TIMEOUT", "45"))
    LLM_CLASSIFY_TIMEOUT = float(os.getenv("LLM_CLASSIFY_TIMEOUT", "15"))
    LLM_INTAKE_TIMEOUT = float(os.getenv("LLM_INTAKE_TIMEOUT", "10"))
    LLM_VISION_TIMEOUT = float(os.getenv("LLM_VISION_TIMEOUT", "10"))
    
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
    AUTH_USERNAME = os.getenv("AUTH_USERNAME", "")
    AUTH_PASSWORD = os.getenv("AUTH_PASSWORD", "")
    AUTH_DISPLAY_NAME = os.getenv("AUTH_DISPLAY_NAME", "Оператор AndATRA")
    AUTH_TOKEN_MAX_AGE_HOURS = int(os.getenv("AUTH_TOKEN_MAX_AGE_HOURS", "24"))
    ENFORCE_API_AUTH = os.getenv(
        "ENFORCE_API_AUTH",
        "true" if IS_PRODUCTION else "false",
    ).lower() == "true"


class TestConfig(Config):
    """Test configuration with an isolated in-memory SQLite database."""

    TESTING = True
    SQLALCHEMY_DATABASE_URI = normalize_database_url(
        os.getenv("TEST_DATABASE_URL", "sqlite+pysqlite:///:memory:")
    )
    SQLALCHEMY_ENGINE_OPTIONS = build_engine_options(SQLALCHEMY_DATABASE_URI)
    APP_ENV = "test"
    IS_PRODUCTION = False
    ENABLE_LLM = False
    ENFORCE_API_AUTH = False
    TELEGRAM_BOT_SECRET = "test_secret"
    AUTH_USERNAME = "test_operator"
    AUTH_PASSWORD = "test_password"
    AUTH_DISPLAY_NAME = "Test Operator"
    AUTH_TOKEN_MAX_AGE_HOURS = 24
