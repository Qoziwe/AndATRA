"""Unit tests for Telegram bot handlers."""

import os
import sys
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

os.environ.setdefault("TELEGRAM_BOT_TOKEN", "test-token")
os.environ.setdefault("BACKEND_URL", "http://testserver:5000")
os.environ.setdefault("BOT_SECRET", "test-secret")

from bot import messages  # noqa: E402
from bot.handlers.appeal import (  # noqa: E402
    appeal_start,
    category_chosen,
    confirm_no,
    confirm_yes,
    photo_skip,
)
from bot.handlers.fallback import fallback  # noqa: E402
from bot.handlers.help import help_command  # noqa: E402
from bot.handlers.start import start  # noqa: E402
from bot.keyboards.main_menu import APPEAL_BUTTON  # noqa: E402
from bot.services import api_client  # noqa: E402
from bot.states import WAITING_CATEGORY, WAITING_LOCATION  # noqa: E402


def _make_update(text: str = "") -> MagicMock:
    """Create a mock Update with a message containing text."""
    update = MagicMock()
    update.message = MagicMock()
    update.message.text = text
    update.message.reply_text = AsyncMock()
    update.message.reply_html = AsyncMock()
    update.effective_user = MagicMock()
    update.effective_user.id = 12345
    return update


def _make_context() -> MagicMock:
    """Create a mock context."""
    ctx = MagicMock()
    ctx.user_data = {}
    ctx.bot = MagicMock()
    return ctx


def _make_callback_query(data: str) -> MagicMock:
    """Create a mock Update with callback_query."""
    update = MagicMock()
    update.callback_query = MagicMock()
    update.callback_query.data = data
    update.callback_query.answer = AsyncMock()
    update.callback_query.edit_message_text = AsyncMock()
    update.callback_query.message = MagicMock()
    update.callback_query.message.reply_text = AsyncMock()
    update.callback_query.message.reply_html = AsyncMock()
    update.effective_user = MagicMock()
    update.effective_user.id = 12345
    update.message = None
    return update


@pytest.mark.asyncio
async def test_start_handler_sends_welcome():
    update = _make_update("/start")
    ctx = _make_context()
    await start(update, ctx)
    update.message.reply_html.assert_called_once()
    assert "AndATRA" in update.message.reply_html.call_args[0][0]


@pytest.mark.asyncio
async def test_help_handler():
    update = _make_update("/help")
    ctx = _make_context()
    await help_command(update, ctx)
    update.message.reply_html.assert_called_once()
    assert len(update.message.reply_html.call_args[0][0]) > 0


@pytest.mark.asyncio
async def test_fallback_handler():
    update = _make_update("random garbage")
    ctx = _make_context()
    await fallback(update, ctx)
    update.message.reply_text.assert_called_once_with(messages.FALLBACK)


@pytest.mark.asyncio
async def test_appeal_flow_step1():
    update = _make_update(APPEAL_BUTTON)
    ctx = _make_context()
    categories = [{"slug": "transport", "name": "Транспорт", "icon": "car"}]

    with patch("bot.handlers.appeal.api_client.get_categories", AsyncMock(return_value=categories)):
        state = await appeal_start(update, ctx)

    assert state == WAITING_CATEGORY
    assert "transport" in ctx.user_data["categories_by_slug"]
    update.message.reply_html.assert_called_once()


@pytest.mark.asyncio
async def test_appeal_flow_category_chosen():
    update = _make_callback_query("cat:transport")
    ctx = _make_context()
    ctx.user_data["categories_by_slug"] = {
        "transport": {"slug": "transport", "name": "Транспорт", "icon": "car"}
    }

    from bot.states import WAITING_TEXT

    state = await category_chosen(update, ctx)
    assert state == WAITING_TEXT
    assert ctx.user_data["category_slug"] == "transport"
    assert "Транспорт" in ctx.user_data["category_name"]


@pytest.mark.asyncio
async def test_appeal_flow_skip_photo():
    update = _make_update("/skip")
    ctx = _make_context()
    state = await photo_skip(update, ctx)
    assert state == WAITING_LOCATION
    assert ctx.user_data["photo_url"] is None
    assert ctx.user_data["photo_base64"] is None


@pytest.mark.asyncio
async def test_appeal_flow_cancel():
    update = _make_callback_query("confirm:no")
    ctx = _make_context()

    from telegram.ext import ConversationHandler

    state = await confirm_no(update, ctx)
    assert state == ConversationHandler.END
    update.callback_query.edit_message_text.assert_called_once_with(
        messages.APPEAL_CANCELLED
    )


@pytest.mark.asyncio
async def test_appeal_flow_submitted_shows_processing_status():
    update = _make_callback_query("confirm:yes")
    ctx = _make_context()
    ctx.user_data.update(
        {
            "text": "На улице Абая большая яма возле остановки.",
            "category_slug": "transport",
            "photo_url": None,
            "photo_base64": None,
            "latitude": None,
            "longitude": None,
            "location_text": None,
        }
    )

    with patch(
        "bot.handlers.appeal.api_client.submit_appeal",
        AsyncMock(return_value={"id": 321}),
    ):
        state = await confirm_yes(update, ctx)

    from telegram.ext import ConversationHandler

    assert state == ConversationHandler.END
    update.callback_query.edit_message_text.assert_called_once_with(
        messages.APPEAL_PROCESSING
    )
    update.callback_query.message.reply_html.assert_called_once_with(
        messages.APPEAL_SUBMITTED.format(appeal_id=321)
    )


@pytest.mark.asyncio
async def test_appeal_flow_rejected_by_backend():
    update = _make_callback_query("confirm:yes")
    ctx = _make_context()
    ctx.user_data.update(
        {
            "text": "Это тест",
            "category_slug": "transport",
            "photo_url": None,
            "photo_base64": None,
            "latitude": None,
            "longitude": None,
            "location_text": None,
        }
    )

    with patch(
        "bot.handlers.appeal.api_client.submit_appeal",
        AsyncMock(side_effect=api_client.AppealRejected("Сообщение похоже на шутку.")),
    ):
        state = await confirm_yes(update, ctx)

    from telegram.ext import ConversationHandler

    assert state == ConversationHandler.END
    update.callback_query.edit_message_text.assert_called_once_with(
        messages.APPEAL_PROCESSING
    )
    update.callback_query.message.reply_html.assert_called_once()
    assert "шутку" in update.callback_query.message.reply_html.call_args[0][0].lower()
