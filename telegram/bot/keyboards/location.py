"""Reply keyboard for quickly sharing the user's location."""

from telegram import KeyboardButton, ReplyKeyboardMarkup

AUTO_LOCATION_BUTTON = "\U0001f4cd \u041e\u043f\u0440\u0435\u0434\u0435\u043b\u0438\u0442\u044c \u0430\u0434\u0440\u0435\u0441 \u0430\u0432\u0442\u043e\u043c\u0430\u0442\u0438\u0447\u0435\u0441\u043a\u0438"


def location_keyboard() -> ReplyKeyboardMarkup:
    """Build a one-time keyboard with a Telegram location request button."""
    keyboard = [[KeyboardButton(AUTO_LOCATION_BUTTON, request_location=True)]]
    return ReplyKeyboardMarkup(
        keyboard,
        resize_keyboard=True,
        one_time_keyboard=True,
    )
