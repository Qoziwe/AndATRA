"""Tests for real-time SocketIO events."""

import pytest

from app import create_app
from app.config import TestConfig
from app.extensions import db, socketio


@pytest.fixture(scope="module")
def socketio_app():
    """Create a separate app instance for SocketIO testing."""
    app = create_app(TestConfig)
    with app.app_context():
        db.create_all()
        from app.data.seed import seed_categories, seed_districts

        seed_categories()
        seed_districts()
    yield app


@pytest.fixture
def socketio_client(socketio_app):
    """Create a SocketIO test client."""
    return socketio.test_client(socketio_app, namespace="/ws/updates")


class TestSocketIO:
    """Tests for WebSocket /ws/updates namespace."""

    def test_socketio_connect(self, socketio_client):
        """Client connects successfully to /ws/updates."""
        assert socketio_client.is_connected(namespace="/ws/updates")

    def test_new_appeal_event_emitted(self, socketio_app, socketio_client):
        """After POST /api/appeals/intake, socket emits 'new_appeal' event."""
        http_client = socketio_app.test_client()

        socketio_client.get_received(namespace="/ws/updates")

        resp = http_client.post(
            "/api/appeals/intake",
            json={
                "telegram_id": 999,
                "text": "Тестовое обращение через сокет",
                "category_slug": "transport",
            },
            headers={"X-Bot-Secret": "test_secret"},
        )
        assert resp.status_code == 201

        received = socketio_client.get_received(namespace="/ws/updates")
        event_names = [event["name"] for event in received]
        assert "new_appeal" in event_names

        new_appeal_event = next(event for event in received if event["name"] == "new_appeal")
        assert "id" in new_appeal_event["args"][0]
