"""AndATRA Telegram bot entry point."""

import asyncio
import logging

from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, filters

from bot.config import TELEGRAM_BOT_TOKEN
from bot.handlers.appeal import build_appeal_conversation
from bot.handlers.fallback import fallback
from bot.handlers.help import help_command
from bot.handlers.start import start
from bot.keyboards.main_menu import HELP_BUTTON

logging.basicConfig(
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)


def _ensure_event_loop() -> None:
    """Create and register an event loop for Python 3.14+ startup."""
    try:
        asyncio.get_running_loop()
    except RuntimeError:
        asyncio.set_event_loop(asyncio.new_event_loop())


def main() -> None:
    """Build the application and start polling."""
    logger.info("Starting AndATRA Telegram bot")
    _ensure_event_loop()

    app = ApplicationBuilder().token(TELEGRAM_BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(build_appeal_conversation())
    app.add_handler(MessageHandler(filters.Regex(f"^{HELP_BUTTON}$"), help_command))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, fallback))

    logger.info("Bot is running. Press Ctrl+C to stop.")
    app.run_polling(drop_pending_updates=True)


if __name__ == "__main__":
    main()
