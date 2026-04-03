"""/help command handler."""

from telegram import Update
from telegram.ext import ContextTypes

from bot.messages import HELP


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send help / usage information."""
    await update.message.reply_html(HELP)
