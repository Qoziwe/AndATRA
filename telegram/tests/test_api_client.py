"""Unit tests for bot.services.api_client using aioresponses to mock aiohttp."""

import asyncio
import os
import sys

import aiohttp
import pytest
from aioresponses import aioresponses

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

os.environ.setdefault("TELEGRAM_BOT_TOKEN", "test-token")
os.environ.setdefault("BACKEND_URL", "http://testserver:5000")
os.environ.setdefault("BOT_SECRET", "test-secret")

from bot import config  # noqa: E402
from bot.services import api_client  # noqa: E402
from bot.services.api_client import ApiError, AppealRejected  # noqa: E402

BACKEND = config.BACKEND_URL


@pytest.mark.asyncio
async def test_submit_appeal_success():
    with aioresponses() as m:
        m.post(
            f"{BACKEND}/api/appeals/intake",
            status=201,
            payload={"success": True, "data": {"id": 42, "status": "new"}},
        )
        result = await api_client.submit_appeal(
            telegram_id=123,
            text="Broken sidewalk on Abay street",
            category_slug="infrastructure",
            photo_base64="ZmFrZQ==",
        )
        assert result["id"] == 42
        assert result["status"] == "new"


@pytest.mark.asyncio
async def test_submit_appeal_rejected():
    with aioresponses() as m:
        m.post(
            f"{BACKEND}/api/appeals/intake",
            status=422,
            payload={"success": False, "error": "Фото похоже на мем"},
        )
        with pytest.raises(AppealRejected, match="мем"):
            await api_client.submit_appeal(
                telegram_id=123,
                text="Серьезная проблема",
                category_slug="transport",
                photo_base64="ZmFrZQ==",
            )


@pytest.mark.asyncio
async def test_submit_appeal_wrong_secret():
    with aioresponses() as m:
        m.post(
            f"{BACKEND}/api/appeals/intake",
            status=403,
            payload={"success": False, "error": "Forbidden"},
        )
        with pytest.raises(ApiError, match="403"):
            await api_client.submit_appeal(
                telegram_id=123,
                text="Test text that is long enough",
                category_slug="transport",
            )


@pytest.mark.asyncio
async def test_submit_appeal_backend_down():
    with aioresponses() as m:
        m.post(
            f"{BACKEND}/api/appeals/intake",
            exception=aiohttp.ClientConnectionError("Connection refused"),
        )
        with pytest.raises(ApiError):
            await api_client.submit_appeal(
                telegram_id=123,
                text="Test text that is long enough",
                category_slug="ecology",
            )


@pytest.mark.asyncio
async def test_submit_appeal_timeout():
    with aioresponses() as m:
        m.post(
            f"{BACKEND}/api/appeals/intake",
            exception=asyncio.TimeoutError("Request timed out"),
        )
        with pytest.raises(ApiError):
            await api_client.submit_appeal(
                telegram_id=123,
                text="Test text that is long enough",
                category_slug="ecology",
            )


@pytest.mark.asyncio
async def test_get_categories_success():
    cats = [
        {"slug": "transport", "name": "Transport"},
        {"slug": "ecology", "name": "Ecology"},
    ]
    with aioresponses() as m:
        m.get(f"{BACKEND}/api/categories", payload={"success": True, "data": cats})
        result = await api_client.get_categories()
        assert len(result) == 2
        assert result[0]["slug"] == "transport"


@pytest.mark.asyncio
async def test_get_categories_timeout():
    with aioresponses() as m:
        m.get(
            f"{BACKEND}/api/categories",
            exception=asyncio.TimeoutError("Request timed out"),
        )
        with pytest.raises(ApiError):
            await api_client.get_categories()


@pytest.mark.asyncio
async def test_health_check_true():
    with aioresponses() as m:
        m.get(
            f"{BACKEND}/api/health",
            payload={"success": True, "data": {"status": "ok"}},
        )
        assert await api_client.health_check() is True


@pytest.mark.asyncio
async def test_health_check_false():
    with aioresponses() as m:
        m.get(f"{BACKEND}/api/health", status=500)
        assert await api_client.health_check() is False


@pytest.mark.asyncio
async def test_health_check_timeout():
    with aioresponses() as m:
        m.get(
            f"{BACKEND}/api/health",
            exception=asyncio.TimeoutError("Request timed out"),
        )
        assert await api_client.health_check() is False
