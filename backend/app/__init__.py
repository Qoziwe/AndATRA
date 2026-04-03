"""Flask application factory."""

from flask import Flask
from sqlalchemy import inspect, text

from app.config import Config
from app.extensions import cors, db, socketio


def _ensure_runtime_schema_compatibility(app: Flask) -> None:
    """Apply additive schema fixes needed by the current app version."""
    inspector = inspect(db.engine)
    tables = set(inspector.get_table_names())
    if "appeals" not in tables:
        return

    appeal_columns = {column["name"] for column in inspector.get_columns("appeals")}
    if "location_text" not in appeal_columns:
        db.session.execute(text("ALTER TABLE appeals ADD COLUMN location_text TEXT"))
        db.session.commit()
        app.logger.info("Added missing appeals.location_text column")


def _ensure_reference_data(app: Flask) -> None:
    """Seed required reference data so the API can start autonomously."""
    if not app.config.get("AUTO_SEED_REFERENCE_DATA", True):
        return

    from app.data.seed import CATEGORIES, DISTRICTS
    from app.models.category import Category
    from app.models.district import District

    if Category.query.count() == 0:
        for category_data in CATEGORIES:
            db.session.add(Category(**category_data))
        app.logger.info("Seeded %d categories automatically", len(CATEGORIES))

    if District.query.count() == 0:
        for district_data in DISTRICTS:
            db.session.add(District(**district_data))
        app.logger.info("Seeded %d districts automatically", len(DISTRICTS))

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

    app.register_blueprint(health_bp, url_prefix="/api")
    app.register_blueprint(appeals_bp, url_prefix="/api")
    app.register_blueprint(analytics_bp, url_prefix="/api")
    app.register_blueprint(chat_bp, url_prefix="/api")
    app.register_blueprint(categories_bp, url_prefix="/api")
    app.register_blueprint(districts_bp, url_prefix="/api")

    from app.api import register_socketio_events

    register_socketio_events(socketio)

    with app.app_context():
        from app.models import appeal, category, chat_log, district  # noqa: F401

        db.create_all()
        _ensure_runtime_schema_compatibility(app)
        _ensure_reference_data(app)

    return app
