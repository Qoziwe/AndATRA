"""Appeal submission multi-step conversation."""

from __future__ import annotations

import base64
import logging

from telegram import PhotoSize, Update
from telegram.ext import (
    CallbackQueryHandler,
    CommandHandler,
    ContextTypes,
    ConversationHandler,
    MessageHandler,
    filters,
)

from bot import messages
from bot.keyboards.categories import (
    categories_keyboard,
    confirm_keyboard,
    format_category_label,
)
from bot.keyboards.location import location_keyboard
from bot.keyboards.main_menu import APPEAL_BUTTON, main_menu_keyboard
from bot.services import api_client
from bot.states import (
    WAITING_CATEGORY,
    WAITING_CONFIRM,
    WAITING_LOCATION,
    WAITING_PHOTO,
    WAITING_TEXT,
)

logger = logging.getLogger(__name__)

MAX_VISION_PHOTO_BYTES = 1_500_000


def _flatten_categories(categories: list[dict]) -> list[dict]:
    """Flatten nested backend categories into a single ordered list."""
    flat: list[dict] = []
    for category in categories:
        flat.append(category)
        flat.extend(_flatten_categories(category.get("children") or []))
    return flat


def _pick_analysis_photo(photos: list[PhotoSize]) -> PhotoSize:
    """Pick a photo size that is good enough for AI but not too heavy for JSON."""
    suitable = [
        photo for photo in photos if (getattr(photo, "file_size", 0) or 0) <= MAX_VISION_PHOTO_BYTES
    ]
    if suitable:
        return suitable[-1]
    return photos[max(0, len(photos) // 2)]


async def appeal_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Entry point: fetch categories from backend and show them."""
    context.user_data.clear()

    try:
        categories = _flatten_categories(await api_client.get_categories())
    except api_client.ApiError:
        logger.exception("Failed to load categories from backend")
        await update.message.reply_text(messages.CATEGORIES_UNAVAILABLE)
        return ConversationHandler.END

    if not categories:
        await update.message.reply_text(messages.CATEGORIES_UNAVAILABLE)
        return ConversationHandler.END

    context.user_data["categories_by_slug"] = {
        category["slug"]: category for category in categories
    }
    await update.message.reply_html(
        messages.CHOOSE_CATEGORY,
        reply_markup=categories_keyboard(categories),
    )
    return WAITING_CATEGORY


async def category_chosen(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle category inline button press."""
    query = update.callback_query
    await query.answer()

    slug = query.data.removeprefix("cat:")
    categories_by_slug = context.user_data.get("categories_by_slug", {})
    category = categories_by_slug.get(slug)
    if not category:
        context.user_data.clear()
        await query.edit_message_text(messages.CATEGORY_INVALID)
        return ConversationHandler.END

    context.user_data["category_slug"] = slug
    context.user_data["category_name"] = format_category_label(category)

    await query.edit_message_text(
        f"Категория: <b>{context.user_data['category_name']}</b>\n\n{messages.ASK_TEXT}",
        parse_mode="HTML",
    )
    return WAITING_TEXT


async def text_received(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Validate and store the problem description."""
    text = update.message.text.strip()

    if len(text) < 10:
        await update.message.reply_text(messages.TEXT_TOO_SHORT)
        return WAITING_TEXT

    if len(text) > 2000:
        await update.message.reply_text(messages.TEXT_TOO_LONG)
        return WAITING_TEXT

    context.user_data["text"] = text
    await update.message.reply_html(messages.ASK_PHOTO)
    return WAITING_PHOTO


async def photo_received(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Download the photo for preview and AI analysis."""
    preview_photo = update.message.photo[-1]
    analysis_photo = _pick_analysis_photo(update.message.photo)

    preview_file = await context.bot.get_file(preview_photo.file_id)
    analysis_file = preview_file
    if analysis_photo.file_id != preview_photo.file_id:
        analysis_file = await context.bot.get_file(analysis_photo.file_id)

    image_bytes = await analysis_file.download_as_bytearray()
    context.user_data["photo_url"] = preview_file.file_path
    context.user_data["photo_base64"] = base64.b64encode(image_bytes).decode("ascii")
    await update.message.reply_html(
        messages.ASK_LOCATION,
        reply_markup=location_keyboard(),
    )
    return WAITING_LOCATION


async def photo_skip(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """User chose to skip the photo step."""
    context.user_data["photo_url"] = None
    context.user_data["photo_base64"] = None
    await update.message.reply_html(
        messages.ASK_LOCATION,
        reply_markup=location_keyboard(),
    )
    return WAITING_LOCATION


async def location_received(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle a shared geo location."""
    loc = update.message.location
    context.user_data["latitude"] = loc.latitude
    context.user_data["longitude"] = loc.longitude
    context.user_data["location_text"] = None
    return await _show_confirmation(update, context)


async def location_text_received(
    update: Update, context: ContextTypes.DEFAULT_TYPE
) -> int:
    """Handle a manually typed address."""
    context.user_data["latitude"] = None
    context.user_data["longitude"] = None
    context.user_data["location_text"] = update.message.text.strip()
    return await _show_confirmation(update, context)


async def location_skip(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """User chose to skip location."""
    context.user_data["latitude"] = None
    context.user_data["longitude"] = None
    context.user_data["location_text"] = None
    return await _show_confirmation(update, context)


async def _show_confirmation(
    update: Update, context: ContextTypes.DEFAULT_TYPE
) -> int:
    """Render the summary card and ask to confirm."""
    data = context.user_data
    text_preview = data["text"][:120] + ("..." if len(data["text"]) > 120 else "")
    photo_status = "Да" if data.get("photo_url") else "Нет"
    location_status = (
        "Да" if data.get("latitude") is not None or data.get("location_text") else "Нет"
    )

    summary = messages.CONFIRM_TEMPLATE.format(
        category=data["category_name"],
        text_preview=text_preview,
        photo_status=photo_status,
        location_status=location_status,
    )

    await update.message.reply_html(summary, reply_markup=confirm_keyboard())
    return WAITING_CONFIRM


async def confirm_yes(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Submit the appeal to the backend."""
    query = update.callback_query
    await query.answer()
    await query.edit_message_text(messages.APPEAL_PROCESSING)

    data = context.user_data
    try:
        result = await api_client.submit_appeal(
            telegram_id=update.effective_user.id,
            text=data["text"],
            category_slug=data["category_slug"],
            photo_url=data.get("photo_url"),
            photo_base64=data.get("photo_base64"),
            latitude=data.get("latitude"),
            longitude=data.get("longitude"),
            location_text=data.get("location_text"),
        )
        appeal_id = result.get("id", "?")
        await query.message.reply_html(
            messages.APPEAL_SUBMITTED.format(appeal_id=appeal_id),
        )
    except api_client.AppealRejected as exc:
        await query.message.reply_html(
            messages.APPEAL_REJECTED.format(reason=str(exc)),
        )
    except api_client.ApiError:
        logger.exception("Appeal submission failed")
        await query.message.reply_text(messages.APPEAL_ERROR)

    context.user_data.clear()
    return ConversationHandler.END


async def confirm_no(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Cancel the appeal."""
    query = update.callback_query
    await query.answer()
    await query.edit_message_text(messages.APPEAL_CANCELLED)
    context.user_data.clear()
    return ConversationHandler.END


async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle /cancel at any point in the conversation."""
    context.user_data.clear()
    await update.message.reply_text(
        messages.APPEAL_CANCELLED,
        reply_markup=main_menu_keyboard(),
    )
    return ConversationHandler.END


def build_appeal_conversation() -> ConversationHandler:
    """Construct and return the appeal conversation handler."""
    return ConversationHandler(
        entry_points=[
            MessageHandler(filters.Regex(f"^{APPEAL_BUTTON}$"), appeal_start),
        ],
        states={
            WAITING_CATEGORY: [
                CallbackQueryHandler(category_chosen, pattern=r"^cat:"),
            ],
            WAITING_TEXT: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, text_received),
            ],
            WAITING_PHOTO: [
                MessageHandler(filters.PHOTO, photo_received),
                CommandHandler("skip", photo_skip),
            ],
            WAITING_LOCATION: [
                MessageHandler(filters.LOCATION, location_received),
                CommandHandler("skip", location_skip),
                MessageHandler(filters.TEXT & ~filters.COMMAND, location_text_received),
            ],
            WAITING_CONFIRM: [
                CallbackQueryHandler(confirm_yes, pattern=r"^confirm:yes$"),
                CallbackQueryHandler(confirm_no, pattern=r"^confirm:no$"),
            ],
        },
        fallbacks=[CommandHandler("cancel", cancel)],
        allow_reentry=True,
    )
