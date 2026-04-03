"""Traffic AI API — traffic analysis and traffic-specific chat."""

from flask import Blueprint, request
from app.utils.response import success_response, error_response
from app.services import traffic_service

traffic_bp = Blueprint("traffic", __name__)


@traffic_bp.route("/traffic/analyze", methods=["GET"])
def analyze_traffic():
    """Get AI-powered traffic analysis and traffic light recommendations.

    Returns recommendations for all monitored intersections.
    """
    try:
        result = traffic_service.analyze_traffic()
        return success_response(result)
    except Exception as exc:
        return error_response(f"Traffic analysis failed: {str(exc)}", 500)


@traffic_bp.route("/traffic/chat", methods=["POST"])
def traffic_chat():
    """Traffic-specific AI chat with traffic context.

    Body: { "message": str, "history": [...], "traffic_context": str }
    """
    data = request.get_json(silent=True) or {}

    message = data.get("message")
    if not message:
        return error_response("Missing required field: message", 400)

    history = data.get("history", [])
    traffic_context = data.get("traffic_context", "")

    result = traffic_service.handle_traffic_chat(message, history, traffic_context)
    return success_response(result)
