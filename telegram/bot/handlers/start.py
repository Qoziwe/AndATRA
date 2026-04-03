"""/start command handler."""

from telegram import Update
from telegram.ext import ContextTypes

from bot.keyboards.main_menu import main_menu_keyboard
from bot.messages import WELCOME


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send a welcome message and show the main-menu keyboard."""
    await update.message.reply_html(
        WELCOME,
        reply_markup=main_menu_keyboard(),
    )
