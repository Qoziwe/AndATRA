"""Appeals API — CRUD and intake endpoint for citizen appeals."""

from flask import Blueprint, request
from app.utils.response import success_response, error_response
from app.utils.validators import (
    require_admin_api_token,
    require_bot_secret,
    validate_required_fields,
)
from app.services import appeal_service

appeals_bp = Blueprint("appeals", __name__)


@appeals_bp.route("/appeals/intake", methods=["POST"])
@require_bot_secret
def intake():
    """Create a new appeal from Telegram bot.

    Validates bot secret, creates appeal, and triggers async classification.
    """
    data = request.get_json(silent=True) or {}

    missing = validate_required_fields(data, ["telegram_id", "text", "category_slug"])
    if missing:
        return error_response(f"Missing required fields: {', '.join(missing)}", 400)

    try:
        appeal = appeal_service.create_appeal(data)
    except appeal_service.AppealRejectedError as exc:
        return error_response(str(exc), 422)
    except ValueError as exc:
        return error_response(str(exc), 400)

    return success_response(appeal.to_dict(), 201)


@appeals_bp.route("/appeals", methods=["GET"])
def list_appeals():
    """Get paginated list of appeals with optional filters."""
    page = max(request.args.get("page", default=1, type=int), 1)
    page_size = request.args.get("pageSize", type=int)
    limit = request.args.get("limit", type=int)
    offset = request.args.get("offset", type=int)

    if page_size is not None:
        limit = page_size
    if offset is None:
        effective_limit = limit if limit is not None else 20
        offset = (page - 1) * effective_limit

    filters = {
        "search": request.args.get("search"),
        "district": request.args.get("district"),
        "category": request.args.get("category"),
        "status": request.args.get("status"),
        "priority": request.args.get("priority"),
        "limit": limit if limit is not None else 20,
        "offset": offset,
    }

    appeals, total = appeal_service.get_appeals(filters)
    response_limit = int(filters["limit"])
    response_offset = int(filters["offset"])

    return success_response({
        "items": [a.to_dict() for a in appeals],
        "total": total,
        "page": page,
        "page_size": response_limit,
        "limit": response_limit,
        "offset": response_offset,
    })


@appeals_bp.route("/appeals/map", methods=["GET"])
def list_map_appeals():
    """Get all appeals that can be shown on the map."""
    appeals = appeal_service.get_map_appeals()
    return success_response([a.to_dict() for a in appeals])


@appeals_bp.route("/appeals/<int:appeal_id>", methods=["GET"])
def get_appeal(appeal_id):
    """Get a single appeal by ID."""
    appeal = appeal_service.get_appeal_by_id(appeal_id)
    if not appeal:
        return error_response("Appeal not found", 404)
    return success_response(appeal.to_dict())


@appeals_bp.route("/appeals/<int:appeal_id>/status", methods=["PATCH"])
@require_admin_api_token
def update_appeal_status(appeal_id):
    """Update an appeal status manually."""
    data = request.get_json(silent=True) or {}
    status = data.get("status")

    if not status or not str(status).strip():
        return error_response("Missing required field: status", 400)

    try:
        appeal = appeal_service.update_appeal_status(appeal_id, str(status))
    except ValueError as exc:
        return error_response(str(exc), 400)

    if not appeal:
        return error_response("Appeal not found", 404)

    return success_response(appeal.to_dict())
