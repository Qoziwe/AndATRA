"""Tests for the appeals API endpoints."""

from unittest.mock import patch

from app.models.appeal import Appeal
from app.models.district import District
from app.services.address_service import ResolvedLocation
from app.services.classification_service import IntakeAssessment


class TestAppealIntake:
    """Tests for POST /api/appeals/intake."""

    def test_intake_creates_appeal(self, client):
        """POST with valid body and correct secret creates an appeal."""
        resp = client.post(
            "/api/appeals/intake",
            json={
                "telegram_id": 123456,
                "text": "Яма на дороге по Абая 10",
                "category_slug": "transport",
                "location_text": "Абая 10",
            },
            headers={"X-Bot-Secret": "test_secret"},
        )
        assert resp.status_code == 201
        data = resp.get_json()
        assert data["success"] is True
        assert data["data"]["text"] == "Яма на дороге по Абая 10"
        assert data["data"]["status"] == "new"
        assert data["data"]["location_text"] == "Абая 10"
        assert data["data"]["category"]["slug"] == "transport"
        assert data["data"]["ai_summary"]

    def test_intake_missing_fields(self, client):
        """POST without required fields returns 400."""
        resp = client.post(
            "/api/appeals/intake",
            json={"telegram_id": 123456},
            headers={"X-Bot-Secret": "test_secret"},
        )
        assert resp.status_code == 400
        data = resp.get_json()
        assert data["success"] is False
        assert "text" in data["error"]
        assert "category_slug" in data["error"]

    def test_intake_invalid_category(self, client):
        """POST with an unknown category_slug returns 400."""
        resp = client.post(
            "/api/appeals/intake",
            json={
                "telegram_id": 123456,
                "text": "Достаточно длинный текст обращения",
                "category_slug": "does-not-exist",
            },
            headers={"X-Bot-Secret": "test_secret"},
        )
        assert resp.status_code == 400
        data = resp.get_json()
        assert data["success"] is False
        assert "Unknown category_slug" in data["error"]

    def test_intake_rejects_prank_without_saving(self, client, app):
        """Rejected appeals return 422 and are not saved to the database."""
        with app.app_context():
            before_count = Appeal.query.count()

        with patch(
            "app.services.appeal_service.analyze_intake",
            return_value=IntakeAssessment(
                accepted=False,
                rejection_reason="Обращение отклонено: сообщение похоже на тест, шутку или спам.",
            ),
        ):
            resp = client.post(
                "/api/appeals/intake",
                json={
                    "telegram_id": 123456,
                    "text": "Это тестовое сообщение, не проблема",
                    "category_slug": "transport",
                },
                headers={"X-Bot-Secret": "test_secret"},
            )

        assert resp.status_code == 422
        data = resp.get_json()
        assert data["success"] is False
        assert "отклонено" in data["error"].lower()

        with app.app_context():
            assert Appeal.query.count() == before_count

    def test_intake_enriches_location_and_district(self, client, app):
        """Coordinates can be enriched into a readable address and district."""
        with app.app_context():
            district = District.query.filter_by(slug="auezovskiy").first()

        with patch(
            "app.services.appeal_service.resolve_location",
            return_value=ResolvedLocation(
                location_text="улица Абая, 10, Ауэзовский район, Алматы",
                district=district,
            ),
        ), patch(
            "app.services.appeal_service.analyze_intake",
            return_value=IntakeAssessment(
                accepted=True,
                category_slug="transport",
                priority="high",
                tags=["яма", "дорога"],
                summary="Дорожное покрытие повреждено, нужна выездная проверка.",
                confidence=0.92,
            ),
        ):
            resp = client.post(
                "/api/appeals/intake",
                json={
                    "telegram_id": 123456,
                    "text": "Глубокая яма возле дома.",
                    "category_slug": "transport",
                    "latitude": 43.2389,
                    "longitude": 76.8897,
                },
                headers={"X-Bot-Secret": "test_secret"},
            )

        assert resp.status_code == 201
        data = resp.get_json()["data"]
        assert "Абая" in data["location_text"]
        assert data["district"]["slug"] == "auezovskiy"
        assert data["priority"] == "high"
        assert data["ai_summary"] == "Дорожное покрытие повреждено, нужна выездная проверка."

    def test_intake_rejects_joke_image_even_with_serious_text(self, client, app):
        """Serious text should still be rejected when the attached image is a joke."""
        with app.app_context():
            before_count = Appeal.query.count()

        with patch(
            "app.services.classification_service.llm_service.call_intake_analysis",
            return_value=(
                '{"accepted": true, "category": "transport", "priority": "high", '
                '"tags": ["яма"], "summary": "На дороге опасная яма.", "confidence": 0.91}'
            ),
        ), patch(
            "app.services.classification_service.llm_service.call_vision_analysis",
            return_value=(
                '{"supports_report": false, "is_relevant": false, "is_joke_or_meme": true, '
                '"rejection_reason": "Обращение отклонено: приложенное фото похоже на мем или шутку.", '
                '"visual_summary": "На фото шуточная картинка, а не реальное место.", "confidence": 0.94}'
            ),
        ):
            resp = client.post(
                "/api/appeals/intake",
                json={
                    "telegram_id": 123456,
                    "text": "На перекрестке глубокая яма, машины объезжают по встречке.",
                    "category_slug": "transport",
                    "photo_url": "https://example.com/test.jpg",
                    "photo_base64": "ZmFrZV9pbWFnZQ==",
                },
                headers={"X-Bot-Secret": "test_secret"},
            )

        assert resp.status_code == 422
        data = resp.get_json()
        assert data["success"] is False
        assert "фото" in data["error"].lower()

        with app.app_context():
            assert Appeal.query.count() == before_count

    def test_intake_skips_vision_when_disabled(self, client, app):
        """Photo analysis should be skipped entirely when vision is disabled."""
        with app.app_context():
            app.config["LLM_VISION_ENABLED"] = False

        try:
            with patch(
                "app.services.classification_service.llm_service.call_intake_analysis",
                return_value=(
                    '{"accepted": true, "category": "transport", "priority": "high", '
                    '"tags": ["яма"], "summary": "На дороге опасная яма.", "confidence": 0.91}'
                ),
            ), patch(
                "app.services.classification_service.llm_service.call_vision_analysis",
            ) as mock_vision:
                resp = client.post(
                    "/api/appeals/intake",
                    json={
                        "telegram_id": 123456,
                        "text": "На перекрестке глубокая яма, машины объезжают по встречке.",
                        "category_slug": "transport",
                        "photo_url": "https://example.com/test.jpg",
                        "photo_base64": "ZmFrZV9pbWFnZQ==",
                    },
                    headers={"X-Bot-Secret": "test_secret"},
                )

            assert resp.status_code == 201
            mock_vision.assert_not_called()
        finally:
            with app.app_context():
                app.config["LLM_VISION_ENABLED"] = True

    def test_intake_invalid_secret(self, client):
        """POST with wrong X-Bot-Secret returns 403."""
        resp = client.post(
            "/api/appeals/intake",
            json={
                "telegram_id": 123,
                "text": "Test appeal",
                "category_slug": "transport",
            },
            headers={"X-Bot-Secret": "wrong_secret"},
        )
        assert resp.status_code == 403
        data = resp.get_json()
        assert data["success"] is False

    def test_intake_missing_secret(self, client):
        """POST without X-Bot-Secret header returns 403."""
        resp = client.post(
            "/api/appeals/intake",
            json={
                "telegram_id": 123,
                "text": "Test appeal",
                "category_slug": "transport",
            },
        )
        assert resp.status_code == 403


class TestAppealsList:
    """Tests for GET /api/appeals."""

    def test_get_appeals_list(self, client):
        """GET /api/appeals returns 200 with a list."""
        resp = client.get("/api/appeals")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["success"] is True
        assert "items" in data["data"]
        assert "total" in data["data"]
        assert isinstance(data["data"]["items"], list)

    def test_get_appeals_filter_by_category(self, client):
        """GET /api/appeals?category=transport filters results."""
        resp = client.get("/api/appeals?category=transport")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["success"] is True
        for item in data["data"]["items"]:
            if item.get("category"):
                assert item["category"]["slug"] == "transport"

    def test_get_map_appeals(self, client):
        """GET /api/appeals/map returns only appeals with an address."""
        resp = client.get("/api/appeals/map")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["success"] is True
        assert isinstance(data["data"], list)
        for item in data["data"]:
            assert item["location_text"]


class TestAppealDetail:
    """Tests for GET /api/appeals/<id>."""

    def test_get_appeal_by_id(self, client):
        """GET /api/appeals/1 returns a single appeal."""
        resp = client.get("/api/appeals/1")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["success"] is True
        assert data["data"]["id"] == 1

    def test_get_appeal_not_found(self, client):
        """GET /api/appeals/99999 returns 404."""
        resp = client.get("/api/appeals/99999")
        assert resp.status_code == 404
        data = resp.get_json()
        assert data["success"] is False


class TestAppealStatusUpdate:
    """Tests for PATCH /api/appeals/<id>/status."""

    def test_update_appeal_status(self, client):
        """PATCH updates an appeal status and returns the updated entity."""
        resp = client.patch("/api/appeals/1/status", json={"status": "irrelevant"})

        assert resp.status_code == 200
        data = resp.get_json()
        assert data["success"] is True
        assert data["data"]["id"] == 1
        assert data["data"]["status"] == "irrelevant"

    def test_update_appeal_status_invalid_value(self, client):
        """PATCH with an unsupported status returns 400."""
        resp = client.patch("/api/appeals/1/status", json={"status": "closed"})

        assert resp.status_code == 400
        data = resp.get_json()
        assert data["success"] is False
        assert "Invalid status" in data["error"]

    def test_update_appeal_status_requires_status(self, client):
        """PATCH without status returns 400."""
        resp = client.patch("/api/appeals/1/status", json={})

        assert resp.status_code == 400
        data = resp.get_json()
        assert data["success"] is False
        assert "status" in data["error"]

    def test_update_appeal_status_not_found(self, client):
        """PATCH for a missing appeal returns 404."""
        resp = client.patch("/api/appeals/99999/status", json={"status": "resolved"})

        assert resp.status_code == 404
        data = resp.get_json()
        assert data["success"] is False
