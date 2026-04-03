"""Inline keyboards for category selection and confirmation."""

from telegram import InlineKeyboardButton, InlineKeyboardMarkup


def format_category_label(category: dict) -> str:
    """Build a human-friendly category label from backend payload."""
    icon = (category.get("icon") or "").strip()
    name = (category.get("name") or category.get("slug") or "").strip()
    return f"{icon} {name}".strip()


def categories_keyboard(categories: list[dict]) -> InlineKeyboardMarkup:
    """Build inline keyboard from backend-provided category data."""
    buttons: list[list[InlineKeyboardButton]] = []

    for i in range(0, len(categories), 2):
        row = []
        for category in categories[i : i + 2]:
            row.append(
                InlineKeyboardButton(
                    format_category_label(category),
                    callback_data=f"cat:{category['slug']}",
                )
            )
        buttons.append(row)

    return InlineKeyboardMarkup(buttons)


def confirm_keyboard() -> InlineKeyboardMarkup:
    """Build inline keyboard for appeal confirmation."""
    return InlineKeyboardMarkup(
        [
            [
                InlineKeyboardButton("✅ Отправить", callback_data="confirm:yes"),
                InlineKeyboardButton("❌ Отменить", callback_data="confirm:no"),
            ]
        ]
    )
