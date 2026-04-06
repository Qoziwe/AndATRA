"""Pytest fixtures for the AndATRA test suite."""

import pytest
from app import create_app
from app.config import TestConfig
from app.extensions import db as _db
from app.data.seed import seed_all


@pytest.fixture(scope="session")
def app():
    """Create Flask app with test config and in-memory SQLite DB."""
    app = create_app(TestConfig)

    with app.app_context():
        _db.create_all()
        yield app
        _db.drop_all()


@pytest.fixture(scope="session")
def client(app):
    """Flask test client."""
    return app.test_client()


@pytest.fixture(scope="session", autouse=True)
def seeded_db(app):
    """Seed the test DB with mock data before running tests."""
    with app.app_context():
        seed_all()
    yield
