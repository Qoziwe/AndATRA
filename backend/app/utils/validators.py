"""Input validation helpers and decorators."""

import hmac
from functools import wraps
from flask import request, current_app

from app.services import auth_service
from app.utils.response import error_response


def _token_matches(provided: str | None, expected: str | None) -> bool:
    if not provided or not expected:
        return False
    return hmac.compare_digest(provided, expected)


def _get_authorization_token() -> str | None:
    authorization = request.headers.get("Authorization", "")
    if authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
        return token or None
    return request.headers.get("X-API-Token")


def _get_expected_tokens(*config_keys: str) -> list[str]:
    return [
        token
        for token in (current_app.config.get(config_key) for config_key in config_keys)
        if isinstance(token, str) and token.strip()
    ]


def _is_token_auth_disabled() -> bool:
    return not current_app.config.get("ENFORCE_API_AUTH", False)


def _request_has_any_token(*config_keys: str) -> bool:
    if _is_token_auth_disabled():
        return True

    provided = _get_authorization_token()
    return any(_token_matches(provided, expected) for expected in _get_expected_tokens(*config_keys))


def require_bot_secret(f):
    """Decorator that checks the X-Bot-Secret header against TELEGRAM_BOT_SECRET config."""

    @wraps(f)
    def decorated_function(*args, **kwargs):
        secret = request.headers.get("X-Bot-Secret")
        expected = current_app.config.get("TELEGRAM_BOT_SECRET")
        if not secret or secret != expected:
            return error_response("Invalid or missing bot secret", 403)
        return f(*args, **kwargs)

    return decorated_function


def require_staff_api_token(f):
    """Backward-compatible alias for authenticated dashboard access."""

    @wraps(f)
    def decorated_function(*args, **kwargs):
        current_user = auth_service.verify_access_token(_get_authorization_token())
        if current_user:
            request.current_user = current_user  # type: ignore[attr-defined]
            return f(*args, **kwargs)
        if _is_token_auth_disabled():
            return f(*args, **kwargs)
        return error_response("Missing or invalid access token", 401)

    return decorated_function


def require_admin_api_token(f):
    """Backward-compatible alias for authenticated dashboard access."""

    @wraps(f)
    def decorated_function(*args, **kwargs):
        current_user = auth_service.verify_access_token(_get_authorization_token())
        if current_user:
            request.current_user = current_user  # type: ignore[attr-defined]
            return f(*args, **kwargs)
        if _is_token_auth_disabled():
            return f(*args, **kwargs)
        return error_response("Missing or invalid access token", 401)

    return decorated_function


def require_authenticated_user(f):
    """Require a valid signed access token when dashboard auth is enabled."""

    @wraps(f)
    def decorated_function(*args, **kwargs):
        current_user = auth_service.verify_access_token(_get_authorization_token())
        if current_user:
            request.current_user = current_user  # type: ignore[attr-defined]
            return f(*args, **kwargs)

        if _is_token_auth_disabled():
            request.current_user = auth_service.build_identity()  # type: ignore[attr-defined]
            return f(*args, **kwargs)

        return error_response("Missing or invalid access token", 401)

    return decorated_function


def has_valid_socketio_token(auth_payload) -> bool:
    """Validate the WebSocket auth token when production auth is enabled."""
    if _is_token_auth_disabled():
        return True

    candidates: list[str | None] = [_get_authorization_token(), request.args.get("token")]
    if isinstance(auth_payload, dict):
        candidates.extend(
            [
                auth_payload.get("token"),
                auth_payload.get("accessToken"),
                auth_payload.get("apiToken"),
            ]
        )
        authorization = auth_payload.get("authorization") or auth_payload.get("Authorization")
        if isinstance(authorization, str) and authorization.lower().startswith("bearer "):
            candidates.append(authorization.split(" ", 1)[1].strip())

    return any(auth_service.verify_access_token(candidate) for candidate in candidates)


def validate_required_fields(data, fields):
    """Check that all required fields are present and non-empty in data dict.

    Returns a list of missing field names, or an empty list if all present.
    """
    missing = []
    for field in fields:
        if field not in data or data[field] is None or (isinstance(data[field], str) and not data[field].strip()):
            missing.append(field)
    return missing
