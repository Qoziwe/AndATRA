"""Single-account authentication helpers for the staff dashboard."""

from __future__ import annotations

import hmac

from flask import current_app
from itsdangerous import BadSignature, BadTimeSignature, URLSafeTimedSerializer


def _serializer() -> URLSafeTimedSerializer:
    return URLSafeTimedSerializer(
        secret_key=current_app.config["SECRET_KEY"],
        salt="andatra-auth-token",
    )


def authenticate_credentials(username: str, password: str) -> bool:
    """Return whether submitted credentials match the configured single account."""
    expected_username = str(current_app.config.get("AUTH_USERNAME", "")).strip()
    expected_password = str(current_app.config.get("AUTH_PASSWORD", "")).strip()
    provided_username = str(username or "").strip()
    provided_password = str(password or "").strip()

    if not expected_username or not expected_password:
        return False

    return hmac.compare_digest(provided_username, expected_username) and hmac.compare_digest(
        provided_password,
        expected_password,
    )


def build_identity() -> dict[str, str]:
    """Return the single supported account identity payload."""
    return {
        "username": current_app.config.get("AUTH_USERNAME", ""),
        "display_name": current_app.config.get("AUTH_DISPLAY_NAME", "Оператор AndATRA"),
        "role": "operator",
    }


def issue_access_token() -> str:
    """Return a signed token for the configured single account."""
    return _serializer().dumps(build_identity())


def verify_access_token(token: str | None) -> dict[str, str] | None:
    """Validate and decode an access token."""
    if not token:
        return None

    max_age = int(current_app.config.get("AUTH_TOKEN_MAX_AGE_HOURS", 24)) * 3600
    try:
        payload = _serializer().loads(token, max_age=max_age)
    except (BadSignature, BadTimeSignature):
        return None

    if not isinstance(payload, dict):
        return None

    expected_username = current_app.config.get("AUTH_USERNAME", "")
    if payload.get("username") != expected_username:
        return None

    return {
        "username": payload.get("username", ""),
        "display_name": payload.get("display_name")
        or current_app.config.get("AUTH_DISPLAY_NAME", "Оператор AndATRA"),
        "role": "operator",
    }
