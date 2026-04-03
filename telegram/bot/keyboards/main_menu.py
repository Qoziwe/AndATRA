"""Main reply keyboard shown after /start."""

from telegram import KeyboardButton, ReplyKeyboardMarkup

APPEAL_BUTTON = "📝 Подать обращение"
HELP_BUTTON = "ℹ️ Помощь"


def main_menu_keyboard() -> ReplyKeyboardMarkup:
    """Build the persistent main-menu reply keyboard."""
    keyboard = [[KeyboardButton(APPEAL_BUTTON), KeyboardButton(HELP_BUTTON)]]
    return ReplyKeyboardMarkup(
        keyboard,
        resize_keyboard=True,
        one_time_keyboard=False,
    )
