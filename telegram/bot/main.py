"""AndATRA Telegram bot entry point."""

import asyncio
import logging
import os
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

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


class HealthCheckHandler(BaseHTTPRequestHandler):
    """Simple HTTP server to answer Render health checks."""
    
    def do_GET(self) -> None:
        self.send_response(200)
        self.send_header("Content-type", "text/plain")
        self.end_headers()
        self.wfile.write(b"OK")
        
    def log_message(self, format: str, *args) -> None:
        pass  # Suppress health check logs

def start_health_server(port: int) -> None:
    """Start the health check HTTP server in a background thread."""
    server = HTTPServer(("0.0.0.0", port), HealthCheckHandler)
    logger.info("Starting health check server on port %s", port)
    threading.Thread(target=server.serve_forever, daemon=True).start()


def main() -> None:
    """Build the application and start polling or webhooks."""
    logger.info("Starting AndATRA Telegram bot")
    _ensure_event_loop()

    app = ApplicationBuilder().token(TELEGRAM_BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(build_appeal_conversation())
    app.add_handler(MessageHandler(filters.Regex(f"^{HELP_BUTTON}$"), help_command))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, fallback))

    port = int(os.environ.get("PORT", "8000"))
    webhook_url = os.environ.get("WEBHOOK_URL", "").strip()

    if webhook_url:
        logger.info("Starting webhook on port %s with URL %s", port, webhook_url)
        app.run_webhook(
            listen="0.0.0.0",
            port=port,
            webhook_url=webhook_url,
            drop_pending_updates=True,
        )
    else:
        logger.info("Bot is running in polling mode. Press Ctrl+C to stop.")
        start_health_server(port)
        app.run_polling(drop_pending_updates=True)


if __name__ == "__main__":
    main()
