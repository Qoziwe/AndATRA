"""Citizen appeal model."""

from datetime import datetime, timezone
from app.extensions import db


class Appeal(db.Model):
    __tablename__ = "appeals"

    id = db.Column(db.Integer, primary_key=True)
    citizen_telegram_id = db.Column(db.BigInteger, nullable=True)
    text = db.Column(db.Text, nullable=False)
    photo_url = db.Column(db.String(500), nullable=True)
    location_text = db.Column(db.String(255), nullable=True)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)

    district_id = db.Column(db.Integer, db.ForeignKey("districts.id"), nullable=True)
    category_id = db.Column(db.Integer, db.ForeignKey("categories.id"), nullable=True)

    priority = db.Column(db.String(20), nullable=False, default="medium")  # low/medium/high/critical
    status = db.Column(db.String(20), nullable=False, default="new")  # new/processing/resolved/rejected

    ai_summary = db.Column(db.Text, nullable=True)
    ai_tags = db.Column(db.JSON, nullable=True)

    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "citizen_telegram_id": self.citizen_telegram_id,
            "text": self.text,
            "photo_url": self.photo_url,
            "location_text": self.location_text,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "district_id": self.district_id,
            "district": self.district.to_dict() if self.district else None,
            "category_id": self.category_id,
            "category": self.category.to_dict(include_children=False) if self.category else None,
            "priority": self.priority,
            "status": self.status,
            "ai_summary": self.ai_summary,
            "ai_tags": self.ai_tags,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
