"""Chat API — AI chat endpoint for akimat staff."""

from flask import Blueprint, request
from app.utils.response import success_response, error_response
from app.utils.validators import require_staff_api_token, validate_required_fields
from app.services import chat_service

chat_bp = Blueprint("chat", __name__)


@chat_bp.route("/chat", methods=["POST"])
@require_staff_api_token
def chat():
    """Process chat message and return AI assistant response.

    Body: { "message": str, "history": [{"role": str, "content": str}] }
    """
    data = request.get_json(silent=True) or {}

    missing = validate_required_fields(data, ["message"])
    if missing:
        return error_response(f"Missing required fields: {', '.join(missing)}", 400)

    history = data.get("history", [])
    response_payload = chat_service.handle_chat(data["message"], history)

    return success_response(response_payload)
