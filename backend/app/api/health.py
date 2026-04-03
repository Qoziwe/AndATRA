"""Health check endpoint."""

from flask import Blueprint
from app.utils.response import success_response

health_bp = Blueprint("health", __name__)


@health_bp.route("/health", methods=["GET"])
def health():
    """Return service health status."""
    return success_response({"status": "ok", "version": "0.1.0"})
