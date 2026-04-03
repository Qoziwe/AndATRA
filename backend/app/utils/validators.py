"""Input validation helpers and decorators."""

from functools import wraps
from flask import request, current_app
from app.utils.response import error_response


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


def validate_required_fields(data, fields):
    """Check that all required fields are present and non-empty in data dict.

    Returns a list of missing field names, or an empty list if all present.
    """
    missing = []
    for field in fields:
        if field not in data or data[field] is None or (isinstance(data[field], str) and not data[field].strip()):
            missing.append(field)
    return missing
