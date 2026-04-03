"""Configuration loaded from environment variables / .env file."""

import os
from pathlib import Path

from dotenv import load_dotenv

# Load .env from the project root (one level above bot/)
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_env_path)


def _require_env(name: str, help_text: str) -> str:
    """Return an env var value or fail fast with a clear message."""
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"{name} is not set. {help_text}")
    return value


def _float_env(name: str, default: float) -> float:
    """Parse a float environment variable with a safe default."""
    raw_value = os.getenv(name, "").strip()
    if not raw_value:
        return default
    try:
        return float(raw_value)
    except ValueError:
        return default


TELEGRAM_BOT_TOKEN: str = _require_env(
    "TELEGRAM_BOT_TOKEN",
    "Copy .env.example to .env and fill in the token from @BotFather.",
)
BACKEND_URL: str = os.getenv("BACKEND_URL", "http://localhost:5000").rstrip("/")
BACKEND_TIMEOUT_SECONDS: float = _float_env("BACKEND_TIMEOUT_SECONDS", 45)
BOT_SECRET: str = _require_env(
    "BOT_SECRET",
    "Set it in telegram/.env and make it match backend TELEGRAM_BOT_SECRET.",
)
