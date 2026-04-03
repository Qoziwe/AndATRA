"""Analytics API — aggregated summary, trends, and heatmap endpoints."""

from flask import Blueprint, request
from app.utils.response import success_response
from app.services import analytics_service

analytics_bp = Blueprint("analytics", __name__)


@analytics_bp.route("/analytics/dashboard", methods=["GET"])
def dashboard():
    """Get dashboard counters for the main frontend page."""
    data = analytics_service.get_dashboard_stats()
    return success_response(data)


@analytics_bp.route("/analytics/summary", methods=["GET"])
def summary():
    """Get aggregated analytics summary for a period."""
    period = request.args.get("period", "30d")
    district = request.args.get("district")
    category = request.args.get("category")

    data = analytics_service.get_summary(period, district, category)
    return success_response(data)


@analytics_bp.route("/analytics/trends", methods=["GET"])
def trends():
    """Get time-series data (appeals per day) for charts."""
    period = request.args.get("period", "30d")
    category = request.args.get("category")

    data = analytics_service.get_trends(period, category)
    return success_response(data)


@analytics_bp.route("/analytics/categories", methods=["GET"])
def categories():
    """Get category metrics for the selected analytics period."""
    period = request.args.get("period", "30d")
    data = analytics_service.get_category_breakdown(period)
    return success_response(data)


@analytics_bp.route("/analytics/heatmap", methods=["GET"])
def heatmap():
    """Get appeals grouped by district with coordinates for map."""
    data = analytics_service.get_heatmap()
    return success_response(data)
