"""Context-aware AI chat service for akimat staff."""

from __future__ import annotations

import logging
import re
from datetime import datetime, timedelta, timezone

import requests

from app.extensions import db
from app.models.appeal import Appeal
from app.models.chat_log import ChatLog
from app.services import llm_service

logger = logging.getLogger(__name__)

REPORT_KEYWORDS = (
    "сводк",
    "отчет",
    "отчёт",
    "доклад",
    "pdf",
    "txt",
    "файл",
    "выгруз",
)


def handle_chat(message: str, history: list[dict] | None = None) -> dict:
    """Process a chat message with DB-enriched context."""
    llm_enabled = llm_service.is_llm_enabled()
    context = _build_context()
    wants_report = _wants_report(message)

    if not llm_enabled:
        response = "LLM модели отключены."
        attachments: list[dict] = []
        assistant_log = ChatLog(role="assistant", content=response)
        try:
            user_log = ChatLog(
                role="user",
                content=message,
                context_snapshot={"context_length": len(context), "attachments": 0},
            )
            db.session.add(user_log)
            db.session.add(assistant_log)
            db.session.commit()
        except Exception as exc:
            logger.error("Failed to save chat log: %s", exc)
            db.session.rollback()

        return {
            "id": assistant_log.id if assistant_log.id else None,
            "role": "assistant",
            "content": response,
            "created_at": (
                assistant_log.created_at.isoformat()
                if assistant_log.created_at
                else datetime.now(timezone.utc).isoformat()
            ),
            "attachments": attachments,
        }

    system_prompt = _build_system_prompt(context, wants_report)
    prompt_parts = []
    if history:
        for entry in history:
            role = entry.get("role")
            if role not in {"user", "assistant"}:
                continue
            role_label = "Пользователь" if role == "user" else "Ассистент"
            prompt_parts.append(f"{role_label}: {entry.get('content', '')}")

    prompt_parts.append(f"Пользователь: {message}")
    full_prompt = "\n".join(prompt_parts)

    try:
        response = llm_service.call_primary(full_prompt, system_prompt)
    except requests.RequestException as exc:
        logger.warning("Chat LLM is unavailable: %s", exc)
        response = (
            "Сейчас нет связи с нейросетью чата. "
            "Проверьте доступность LLM-ноды и попробуйте снова."
        )
    except Exception as exc:
        logger.error("Chat LLM call failed: %s", exc)
        response = "Произошла ошибка при обработке запроса в чате."

    if wants_report:
        response = _normalize_report_content(response)

    attachments = _build_attachments(message, response) if wants_report else []

    assistant_log = ChatLog(role="assistant", content=response)
    try:
        user_log = ChatLog(
            role="user",
            content=message,
            context_snapshot={"context_length": len(context), "attachments": len(attachments)},
        )
        db.session.add(user_log)
        db.session.add(assistant_log)
        db.session.commit()
    except Exception as exc:
        logger.error("Failed to save chat log: %s", exc)
        db.session.rollback()

    payload = {
        "id": assistant_log.id if assistant_log.id else None,
        "role": "assistant",
        "content": response,
        "created_at": (
            assistant_log.created_at.isoformat()
            if assistant_log.created_at
            else datetime.now(timezone.utc).isoformat()
        ),
        "attachments": attachments,
    }
    return payload


def _build_system_prompt(context: str, wants_report: bool) -> str:
    report_clause = (
        "Если пользователь просит сводку, отчет, PDF, TXT или файл, подготовь полную структурированную сводку "
        "с коротким заголовком в первой строке, ключевыми выводами, рисками, приоритетами и рекомендуемыми действиями. "
        "Отвечай строго на русском языке. Не используй markdown-разметку, символы **, #, ``` и декоративные маркеры. "
        "Пиши так, чтобы текст можно было сразу выгрузить в документ."
        if wants_report
        else "Отвечай на русском языке, кратко и по делу."
    )
    return f"""Ты — интеллектуальный ассистент платформы AndATRA для акимата города.
Ты помогаешь сотрудникам анализировать обращения граждан, городскую статистику
и предлагать решения. {report_clause}

Текущие данные из базы:
{context}"""


def _build_context() -> str:
    """Build a context string from recent DB data for the LLM system prompt."""
    parts: list[str] = []

    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    recent_appeals = Appeal.query.filter(Appeal.created_at >= week_ago).all()
    if recent_appeals:
        parts.append(f"Обращений за последние 7 дней: {len(recent_appeals)}")

        status_counts: dict[str, int] = {}
        priority_counts: dict[str, int] = {}
        category_counts: dict[str, int] = {}

        for appeal in recent_appeals:
            status_counts[appeal.status] = status_counts.get(appeal.status, 0) + 1
            priority_counts[appeal.priority] = priority_counts.get(appeal.priority, 0) + 1
            category_name = appeal.category.name if appeal.category else "Без категории"
            category_counts[category_name] = category_counts.get(category_name, 0) + 1

        parts.append(f"По статусам: {status_counts}")
        parts.append(f"По приоритету: {priority_counts}")
        parts.append(f"По категориям: {category_counts}")

        critical_examples = [
            f"#{appeal.id}: {appeal.text[:120]}"
            for appeal in recent_appeals
            if appeal.priority == "critical"
        ][:5]
        if critical_examples:
            parts.append("Критические кейсы:\n" + "\n".join(critical_examples))

    return "\n".join(parts) if parts else "Нет данных в базе."


def _wants_report(message: str) -> bool:
    normalized = message.casefold()
    return any(keyword in normalized for keyword in REPORT_KEYWORDS)


def _build_attachments(message: str, content: str) -> list[dict]:
    title = _extract_report_title(content, message)
    filename_base = _slugify_filename(title)
    return [
        {
            "id": f"{filename_base}-txt",
            "kind": "txt",
            "label": "TXT",
            "filename": f"{filename_base}.txt",
            "title": title,
            "content": content,
        },
        {
            "id": f"{filename_base}-pdf",
            "kind": "pdf",
            "label": "PDF",
            "filename": f"{filename_base}.pdf",
            "title": title,
            "content": content,
        },
    ]


def _extract_report_title(content: str, message: str) -> str:
    for raw_line in content.splitlines():
        line = raw_line.strip(" -•\t")
        if not line:
            continue
        if re.match(r"^\d+[.)]\s", line):
            continue
        if line.endswith(":") or len(line) > 90:
            continue
        if not re.search(r"[А-Яа-яЁё]", line):
            continue
        if line.endswith((".", "!", "?")) and len(line.split()) > 6:
            continue
        return line[:80]

    return _fallback_report_title(message)


def _fallback_report_title(message: str) -> str:
    normalized = message.casefold()
    if "недел" in normalized:
        return "Еженедельная сводка по обращениям"
    if "меся" in normalized:
        return "Ежемесячная сводка по обращениям"
    if "день" in normalized or "сегодня" in normalized or "сутк" in normalized:
        return "Оперативная сводка по обращениям"
    if "район" in normalized:
        return "Сводка по районам"
    if "категор" in normalized:
        return "Сводка по категориям обращений"
    return "Сводка AndATRA"


def _normalize_report_content(content: str) -> str:
    normalized_lines: list[str] = []
    previous_blank = False

    for raw_line in content.replace("\r\n", "\n").replace("\r", "\n").split("\n"):
        line = raw_line.strip()
        if re.fullmatch(r"[|`~=_-]+", line or ""):
            line = ""
        else:
            line = re.sub(r"^\s{0,3}#{1,6}\s*", "", line)
            line = re.sub(r"^\s*>\s?", "", line)
            line = re.sub(r"^\s*[-*+]\s+", "- ", line)
            line = re.sub(r"^\s*(\d+)\)\s+", r"\1. ", line)
            line = _strip_markdown_inline(line)
            line = re.sub(r"\s{2,}", " ", line).strip()
            if line in {"|", "-"}:
                line = ""

        if not line:
            if not previous_blank and normalized_lines:
                normalized_lines.append("")
            previous_blank = True
            continue

        normalized_lines.append(line)
        previous_blank = False

    return "\n".join(normalized_lines).strip()


def _strip_markdown_inline(value: str) -> str:
    cleaned = value
    patterns = (
        (r"\*\*(.*?)\*\*", r"\1"),
        (r"__(.*?)__", r"\1"),
        (r"~~(.*?)~~", r"\1"),
        (r"`([^`]+)`", r"\1"),
        (r"(?<!\w)\*([^*]+)\*(?!\w)", r"\1"),
        (r"(?<!\w)_([^_]+)_(?!\w)", r"\1"),
    )
    for pattern, replacement in patterns:
        cleaned = re.sub(pattern, replacement, cleaned)
    return cleaned


def _slugify_filename(value: str) -> str:
    transliterated = value.lower()
    replacements = {
        "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "e",
        "ж": "zh", "з": "z", "и": "i", "й": "y", "к": "k", "л": "l", "м": "m",
        "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u",
        "ф": "f", "х": "h", "ц": "ts", "ч": "ch", "ш": "sh", "щ": "sch",
        "ъ": "", "ы": "y", "ь": "", "э": "e", "ю": "yu", "я": "ya",
    }
    transliterated = "".join(replacements.get(char, char) for char in transliterated)
    transliterated = re.sub(r"[^a-z0-9]+", "-", transliterated).strip("-")
    return transliterated[:60] or "andatra-report"
