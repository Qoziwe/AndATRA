"""Health check endpoint."""

from flask import Blueprint
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.database import REQUIRED_SCHEMA_TABLES, schema_has_required_tables
from app.extensions import db
from app.utils.response import success_response

health_bp = Blueprint("health", __name__)


@health_bp.route("/health", methods=["GET"])
def health():
    """Return service health status."""
    return success_response({"status": "ok", "version": "0.1.0"})


@health_bp.route("/ready", methods=["GET"])
def ready():
    """Return whether the app can serve production traffic."""
    try:
        db.session.execute(text("SELECT 1"))
        schema_ready = schema_has_required_tables(db.engine, REQUIRED_SCHEMA_TABLES)
    except SQLAlchemyError as exc:
        return success_response(
            {
                "status": "error",
                "ready": False,
                "reason": "database_unreachable",
                "details": str(exc.__class__.__name__),
            },
            503,
        )

    if not schema_ready:
        return success_response(
            {
                "status": "error",
                "ready": False,
                "reason": "schema_not_initialized",
            },
            503,
        )

    return success_response({"status": "ok", "ready": True})
