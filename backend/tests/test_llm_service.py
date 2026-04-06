"""Tests for the LLM service."""

from unittest.mock import MagicMock, patch

from app.services import llm_service


class TestLLMService:
    """Tests for llm_service functions."""

    @patch("app.services.llm_service.SESSION.post")
    def test_call_primary_success(self, mock_post, app):
        """call_primary with mocked SESSION.post returns fake response."""
        with app.app_context():
            app.config["ENABLE_LLM"] = True

            mock_resp = MagicMock()
            mock_resp.json.return_value = {"response": "Тестовый ответ от LLM"}
            mock_resp.raise_for_status = MagicMock()
            mock_post.return_value = mock_resp

            with patch("app.services.llm_service._resolve_model_name", return_value="llama3"):
                result = llm_service.call_primary("Тест", "Системный промпт")

            assert result == "Тестовый ответ от LLM"
            mock_post.assert_called_once()

    @patch("app.services.llm_service.SESSION.post")
    def test_classify_fallback_to_primary(self, mock_post, app):
        """When classify node fails, call_classify falls back to the primary node."""
        with app.app_context():
            app.config["ENABLE_LLM"] = True

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

    def test_call_primary_raises_when_llm_disabled(self, app):
        """Disabled LLM mode should raise a dedicated error."""
        with app.app_context():
            app.config["ENABLE_LLM"] = False

            try:
                llm_service.call_primary("Тест")
            except llm_service.LLMDisabledError:
                pass
            else:
                raise AssertionError("Expected LLMDisabledError when ENABLE_LLM=false")

    @patch("app.services.llm_service.SESSION.post")
    def test_intake_analysis_uses_configured_timeout(self, mock_post, app):
        """Intake analysis should use the shorter request timeout from config."""
        with app.app_context():
            app.config["ENABLE_LLM"] = True
            app.config["LLM_INTAKE_TIMEOUT"] = 9

            mock_resp = MagicMock()
            mock_resp.json.return_value = {"response": '{"accepted": true, "category": "transport"}'}
            mock_resp.raise_for_status = MagicMock()
            mock_post.return_value = mock_resp

            with patch("app.services.llm_service._resolve_model_name", return_value="llama3"):
                llm_service.call_intake_analysis("Тест")

            assert mock_post.call_args.kwargs["timeout"] == 9

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
