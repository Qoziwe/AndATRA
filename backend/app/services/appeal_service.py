"""Appeal service — business logic for citizen appeals."""

from __future__ import annotations

import logging

from sqlalchemy import or_

from app.extensions import db, socketio
from app.models.appeal import Appeal
from app.models.category import Category
from app.services.address_service import resolve_location
from app.services.classification_service import analyze_intake, apply_assessment_to_appeal

logger = logging.getLogger(__name__)


class AppealRejectedError(ValueError):
    """Raised when AI moderation rejects an intake submission."""


def create_appeal(data: dict) -> Appeal:
    """Create a new appeal from intake data."""
    category_slug = data["category_slug"]
    category = Category.query.filter_by(slug=category_slug).first()
    if not category:
        raise ValueError(f"Unknown category_slug: {category_slug}")

    resolved_location = resolve_location(
        latitude=data.get("latitude"),
        longitude=data.get("longitude"),
        location_text=data.get("location_text"),
    )
    assessment = analyze_intake(
        text=data["text"],
        submitted_category_slug=category_slug,
        location_text=resolved_location.location_text,
        photo_base64=data.get("photo_base64"),
    )
    if not assessment.accepted:
        raise AppealRejectedError(
            assessment.rejection_reason or "Обращение отклонено AI-модерацией."
        )

    appeal = Appeal(
        citizen_telegram_id=data.get("telegram_id"),
        text=data["text"],
        photo_url=data.get("photo_url"),
        location_text=resolved_location.location_text,
        latitude=data.get("latitude"),
        longitude=data.get("longitude"),
        category_id=category.id,
        status="new",
        priority="medium",
    )
    if resolved_location.district:
        appeal.district_id = resolved_location.district.id

    apply_assessment_to_appeal(
        appeal,
        assessment,
        fallback_district=resolved_location.district,
    )

    db.session.add(appeal)
    db.session.commit()

    socketio.emit(
        "new_appeal",
        {"id": appeal.id, "text": appeal.text[:100]},
        namespace="/ws/updates",
    )
    return appeal


def get_appeals(filters: dict) -> tuple[list[Appeal], int]:
    """Get paginated, filtered list of appeals."""
    query = Appeal.query

    search = (filters.get("search") or "").strip()
    if search:
        search_filters = [
            Appeal.text.ilike(f"%{search}%"),
            Appeal.location_text.ilike(f"%{search}%"),
        ]
        if search.isdigit():
            search_filters.append(Appeal.id == int(search))
        query = query.filter(or_(*search_filters))

    if filters.get("district"):
        from app.models.district import District

        district = District.query.filter_by(slug=filters["district"]).first()
        if district:
            query = query.filter(Appeal.district_id == district.id)

    if filters.get("category"):
        category = Category.query.filter_by(slug=filters["category"]).first()
        if category:
            query = query.filter(Appeal.category_id == category.id)

    if filters.get("status"):
        query = query.filter(Appeal.status == filters["status"])

    if filters.get("priority"):
        query = query.filter(Appeal.priority == filters["priority"])

    total = query.count()

    limit = min(int(filters.get("limit", 20)), 100)
    offset = int(filters.get("offset", 0))

    appeals = query.order_by(Appeal.created_at.desc()).offset(offset).limit(limit).all()
    return appeals, total


def get_appeal_by_id(appeal_id: int) -> Appeal | None:
    """Get a single appeal by ID."""
    return db.session.get(Appeal, appeal_id)
