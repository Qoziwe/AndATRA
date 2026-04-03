"""Categories API for frontend reference and aggregate category data."""

from flask import Blueprint, request

from app.services import analytics_service
from app.utils.response import success_response

categories_bp = Blueprint("categories", __name__)


@categories_bp.route("/categories", methods=["GET"])
def list_categories():
    """Return top-level categories enriched with DB-backed counters."""
    period = request.args.get("period", "30d")
    return success_response(analytics_service.get_categories_catalog(period))
