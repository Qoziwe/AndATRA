"""Authentication API for the single staff account."""

from flask import Blueprint, request

from app.services import auth_service
from app.utils.response import error_response, success_response
from app.utils.validators import require_authenticated_user, validate_required_fields

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/auth/login", methods=["POST"])
def login():
    """Authenticate the single configured operator account."""
    data = request.get_json(silent=True) or {}
    missing = validate_required_fields(data, ["username", "password"])
    if missing:
        return error_response(f"Missing required fields: {', '.join(missing)}", 400)

    if not auth_service.authenticate_credentials(data["username"], data["password"]):
        return error_response("Invalid username or password", 401)

    identity = auth_service.build_identity()
    return success_response(
        {
            "access_token": auth_service.issue_access_token(),
            "user": identity,
        }
    )


@auth_bp.route("/auth/me", methods=["GET"])
@require_authenticated_user
def me():
    """Return the current authenticated operator identity."""
    return success_response({"user": request.current_user})  # type: ignore[attr-defined]
