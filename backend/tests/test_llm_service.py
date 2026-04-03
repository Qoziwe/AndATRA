"""Tests for the LLM service."""

from unittest.mock import MagicMock, patch

from app.services import llm_service


class TestLLMService:
    """Tests for llm_service functions."""

    @patch("app.services.llm_service.SESSION.post")
    def test_call_primary_success(self, mock_post, app):
        """call_primary with mocked SESSION.post returns fake response."""
        with app.app_context():
            app.config["LLM_MOCK_MODE"] = False

            mock_resp = MagicMock()
            mock_resp.json.return_value = {"response": "Тестовый ответ от LLM"}
            mock_resp.raise_for_status = MagicMock()
            mock_post.return_value = mock_resp

            with patch("app.services.llm_service._resolve_model_name", return_value="llama3"):
                result = llm_service.call_primary("Тест", "Системный промпт")

            assert result == "Тестовый ответ от LLM"
            mock_post.assert_called_once()
            app.config["LLM_MOCK_MODE"] = True

    @patch("app.services.llm_service.SESSION.post")
    def test_classify_fallback_to_primary(self, mock_post, app):
        """When classify node fails, call_classify falls back to the primary node."""
        with app.app_context():
            app.config["LLM_MOCK_MODE"] = False

            import requests as req

            mock_ok_resp = MagicMock()
            mock_ok_resp.json.return_value = {"response": '{"category": "transport"}'}
            mock_ok_resp.raise_for_status = MagicMock()

            mock_post.side_effect = [req.RequestException("fail"), mock_ok_resp]

            with patch(
                "app.services.llm_service._resolve_model_name",
                side_effect=lambda _url, model: model,
            ):
                result = llm_service.call_classify("Яма на дороге")

            assert "transport" in result
            app.config["LLM_MOCK_MODE"] = True

    def test_classify_mock_returns_json(self, app):
        """In mock mode, call_classify returns parseable JSON."""
        import json

        with app.app_context():
            result = llm_service.call_classify("Тест")
            parsed = json.loads(result)
            assert "category" in parsed
            assert "priority" in parsed
            assert "tags" in parsed
            assert isinstance(parsed["tags"], list)

    def test_intake_analysis_mock_returns_decision(self, app):
        """In mock mode, call_intake_analysis returns moderation metadata."""
        import json

        with app.app_context():
            result = llm_service.call_intake_analysis("Тест")
            parsed = json.loads(result)
            assert "accepted" in parsed
            assert "category" in parsed
            assert "summary" in parsed

    def test_vision_analysis_mock_returns_decision(self, app):
        """In mock mode, call_vision_analysis returns image moderation metadata."""
        import json

        with app.app_context():
            result = llm_service.call_vision_analysis("Тест", ["ZmFrZQ=="])
            parsed = json.loads(result)
            assert "supports_report" in parsed
            assert "is_joke_or_meme" in parsed
            assert "visual_summary" in parsed

    @patch("app.services.llm_service.SESSION.post")
    def test_intake_analysis_uses_configured_timeout(self, mock_post, app):
        """Intake analysis should use the shorter request timeout from config."""
        with app.app_context():
            app.config["LLM_MOCK_MODE"] = False
            app.config["LLM_INTAKE_TIMEOUT"] = 9

            mock_resp = MagicMock()
            mock_resp.json.return_value = {"response": '{"accepted": true, "category": "transport"}'}
            mock_resp.raise_for_status = MagicMock()
            mock_post.return_value = mock_resp

            with patch("app.services.llm_service._resolve_model_name", return_value="llama3"):
                llm_service.call_intake_analysis("Тест")

            assert mock_post.call_args.kwargs["timeout"] == 9
            app.config["LLM_MOCK_MODE"] = True

    @patch("app.services.llm_service.SESSION.get")
    def test_resolve_model_name_uses_cache(self, mock_get):
        """Repeated model resolution should avoid extra /api/tags calls."""
        mock_resp = MagicMock()
        mock_resp.raise_for_status = MagicMock()
        mock_resp.json.return_value = {"models": [{"name": "llama3:latest"}]}
        mock_get.return_value = mock_resp

        llm_service._MODEL_NAME_CACHE.clear()

        first = llm_service._resolve_model_name("http://node:11434", "llama3")
        second = llm_service._resolve_model_name("http://node:11434", "llama3")

        assert first == "llama3:latest"
        assert second == "llama3:latest"
        mock_get.assert_called_once()
