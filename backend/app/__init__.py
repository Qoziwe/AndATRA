"""Flask application factory."""

from flask import Flask
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.config import Config
from app.database import REQUIRED_SCHEMA_TABLES, schema_has_required_tables
from app.extensions import cors, db, socketio


def _verify_database_connection() -> None:
    """Fail fast when the configured database is unreachable."""
    db.session.execute(text("SELECT 1"))


def _schema_is_ready() -> bool:
    """Return whether Alembic migrations have already created the app schema."""
    return schema_has_required_tables(db.engine, REQUIRED_SCHEMA_TABLES)


def _ensure_reference_data(app: Flask) -> None:
    """Seed required reference data so the API can start autonomously."""
    if not app.config.get("AUTO_SEED_REFERENCE_DATA", True):
        return

    if not _schema_is_ready():
        app.logger.warning(
            "Database schema is not initialized. Run `alembic upgrade head` before starting the backend."
        )
        return

    from app.data.seed import CATEGORIES, DISTRICTS
    from app.models.category import Category
    from app.models.district import District

    pending_writes = False
    if Category.query.count() == 0:
        for category_data in CATEGORIES:
            db.session.add(Category(**category_data))
        app.logger.info("Seeded %d categories automatically", len(CATEGORIES))
        pending_writes = True

    if District.query.count() == 0:
        for district_data in DISTRICTS:
            db.session.add(District(**district_data))
        app.logger.info("Seeded %d districts automatically", len(DISTRICTS))
        pending_writes = True

    if pending_writes:
        db.session.commit()


def create_app(config_class=Config):
    """Create and configure the Flask application."""
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    cors.init_app(app, origins=app.config["CORS_ORIGINS"])
    socketio.init_app(app, async_mode=app.config["SOCKETIO_ASYNC_MODE"])

    from app.api.analytics import analytics_bp
    from app.api.appeals import appeals_bp
    from app.api.categories import categories_bp
    from app.api.chat import chat_bp
    from app.api.districts import districts_bp
    from app.api.health import health_bp
    from app.api.traffic import traffic_bp

    app.register_blueprint(health_bp, url_prefix="/api")
    app.register_blueprint(appeals_bp, url_prefix="/api")
    app.register_blueprint(analytics_bp, url_prefix="/api")
    app.register_blueprint(chat_bp, url_prefix="/api")
    app.register_blueprint(categories_bp, url_prefix="/api")
    app.register_blueprint(districts_bp, url_prefix="/api")
    app.register_blueprint(traffic_bp, url_prefix="/api")

    from app.api import register_socketio_events

    register_socketio_events(socketio)

    with app.app_context():
        from app.models import appeal, category, chat_log, district  # noqa: F401

        try:
            _verify_database_connection()
        except SQLAlchemyError as exc:
            raise RuntimeError(
                "Database connection failed. Check DATABASE_URL and PostgreSQL availability."
            ) from exc
        _ensure_reference_data(app)

    return app
