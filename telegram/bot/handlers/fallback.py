"""Fallback handler for unknown messages outside a conversation."""

from telegram import Update
from telegram.ext import ContextTypes

from bot.messages import FALLBACK


async def fallback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Reply with a nudge toward /start."""
    await update.message.reply_text(FALLBACK)
