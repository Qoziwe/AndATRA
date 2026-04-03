"""Tests for the chat API endpoint."""

from unittest.mock import patch

import requests


class TestChatEndpoint:
    """Tests for POST /api/chat."""

    @patch("app.services.chat_service.llm_service.call_primary")
    def test_chat_returns_response(self, mock_primary, client):
        """POST /api/chat with a message returns 200 with assistant response."""
        mock_primary.return_value = "Тестовый ответ ассистента"

        resp = client.post(
            "/api/chat",
            json={"message": "Какие проблемы в городе?"},
        )
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["success"] is True
        assert data["data"]["role"] == "assistant"
        assert isinstance(data["data"]["content"], str)
        assert len(data["data"]["content"]) > 0
        assert data["data"]["attachments"] == []

    @patch("app.services.chat_service.llm_service.call_primary")
    def test_chat_with_history(self, mock_primary, client):
        """POST /api/chat with message + history array returns 200."""
        mock_primary.return_value = "Ответ с учётом контекста"

        resp = client.post(
            "/api/chat",
            json={
                "message": "А что по транспорту?",
                "history": [
                    {"role": "user", "content": "Привет"},
                    {"role": "assistant", "content": "Здравствуйте!"},
                ],
            },
        )
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["success"] is True
        assert data["data"]["role"] == "assistant"

    @patch("app.services.chat_service.llm_service.call_primary")
    def test_chat_builds_export_attachments_for_report_request(self, mock_primary, client):
        """Requests for report export return TXT and PDF attachments metadata."""
        mock_primary.return_value = "Полная сводка по обращениям за неделю."

        resp = client.post(
            "/api/chat",
            json={"message": "Сделай полную сводку и подготовь pdf и txt файл"},
        )

        assert resp.status_code == 200
        data = resp.get_json()["data"]
        assert data["role"] == "assistant"
        assert len(data["attachments"]) == 2
        assert {item["kind"] for item in data["attachments"]} == {"txt", "pdf"}
        assert all(item["content"] == data["content"] for item in data["attachments"])

    @patch("app.services.chat_service.llm_service.call_primary")
    def test_chat_uses_generated_report_title_and_cleans_markdown(self, mock_primary, client):
        """Report export uses a cleaned assistant title instead of the user prompt."""
        mock_primary.return_value = (
            "**Еженедельная сводка по обращениям**\n\n"
            "**Обзор**\n"
            "За неделю обработано 22 обращения.\n\n"
            "* Новые: 14\n"
            "* В работе: 5"
        )

        resp = client.post(
            "/api/chat",
            json={"message": "сделай мне сводку за неделю"},
        )

        assert resp.status_code == 200
        data = resp.get_json()["data"]
        assert data["content"].startswith("Еженедельная сводка по обращениям")
        assert "**" not in data["content"]
        assert "* " not in data["content"]
        assert all(item["title"] == "Еженедельная сводка по обращениям" for item in data["attachments"])
        assert all(item["title"] != "сделай мне сводку за неделю" for item in data["attachments"])

    def test_chat_missing_message(self, client):
        """POST /api/chat without message returns 400."""
        resp = client.post("/api/chat", json={})
        assert resp.status_code == 400
        data = resp.get_json()
        assert data["success"] is False

    @patch("app.services.chat_service.llm_service.call_primary")
    def test_chat_reports_unavailable_llm(self, mock_primary, client):
        """POST /api/chat returns a clear message when the chat LLM is unavailable."""
        mock_primary.side_effect = requests.ConnectionError("LLM node is offline")

        resp = client.post(
            "/api/chat",
            json={"message": "Покажи сводку по обращениям"},
        )

        assert resp.status_code == 200
        data = resp.get_json()
        assert data["success"] is True
        assert data["data"]["role"] == "assistant"
        assert "нет связи с нейросетью чата" in data["data"]["content"].lower()
