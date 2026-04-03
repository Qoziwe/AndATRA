"""Async HTTP client for the AndATRA backend API."""

from __future__ import annotations

import asyncio
import logging

import aiohttp

from bot.config import BACKEND_TIMEOUT_SECONDS, BACKEND_URL, BOT_SECRET

logger = logging.getLogger(__name__)

_HEADERS = {
    "X-Bot-Secret": BOT_SECRET,
    "Content-Type": "application/json",
}

_TIMEOUT = aiohttp.ClientTimeout(total=BACKEND_TIMEOUT_SECONDS)


class ApiError(Exception):
    """Raised when the backend returns an error or is unreachable."""


class AppealRejected(ApiError):
    """Raised when backend moderation rejects the appeal."""


async def submit_appeal(
    telegram_id: int,
    text: str,
    category_slug: str,
    photo_url: str | None = None,
    photo_base64: str | None = None,
    latitude: float | None = None,
    longitude: float | None = None,
    location_text: str | None = None,
) -> dict:
    """POST an appeal to the backend intake endpoint."""
    url = f"{BACKEND_URL}/api/appeals/intake"
    payload = {
        "telegram_id": telegram_id,
        "text": text,
        "category_slug": category_slug,
        "photo_url": photo_url,
        "photo_base64": photo_base64,
        "latitude": latitude,
        "longitude": longitude,
        "location_text": location_text,
    }

    try:
        async with aiohttp.ClientSession(timeout=_TIMEOUT) as session:
            async with session.post(url, json=payload, headers=_HEADERS) as resp:
                body = await resp.json()
                if resp.status == 422:
                    raise AppealRejected(
                        body.get("error") or "Обращение отклонено модерацией."
                    )
                if resp.status not in (200, 201) or not body.get("success"):
                    logger.error("Backend error %s: %s", resp.status, body)
                    raise ApiError(f"Backend returned {resp.status}")
                return body["data"]
    except (aiohttp.ClientError, asyncio.TimeoutError) as exc:
        logger.exception("Failed to reach backend")
        raise ApiError(str(exc)) from exc


async def get_categories() -> list[dict]:
    """GET the list of appeal categories from the backend."""
    url = f"{BACKEND_URL}/api/categories"
    try:
        async with aiohttp.ClientSession(timeout=_TIMEOUT) as session:
            async with session.get(url, headers=_HEADERS) as resp:
                body = await resp.json()
                if resp.status != 200 or not body.get("success"):
                    raise ApiError(f"Backend returned {resp.status}")
                return body["data"]
    except (aiohttp.ClientError, asyncio.TimeoutError) as exc:
        logger.exception("Failed to reach backend")
        raise ApiError(str(exc)) from exc


async def health_check() -> bool:
    """Return True if backend health endpoint responds with 200."""
    url = f"{BACKEND_URL}/api/health"
    try:
        async with aiohttp.ClientSession(timeout=_TIMEOUT) as session:
            async with session.get(url, headers=_HEADERS) as resp:
                return resp.status == 200
    except (aiohttp.ClientError, asyncio.TimeoutError):
        return False
