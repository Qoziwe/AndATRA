"""Classification and moderation service for appeals."""

from __future__ import annotations

import json
import logging
import re
from dataclasses import dataclass, field

import requests
from flask import current_app

from app.extensions import db
from app.models.category import Category
from app.services import llm_service
from app.services.address_service import match_district

logger = logging.getLogger(__name__)

VALID_PRIORITIES = {"low", "medium", "high", "critical"}
PRANK_PATTERNS = (
    r"\b(тест(овое)? сообщение|test message|проверка системы|это тест)\b",
    r"\b(розыгрыш|пранк|шутка|лол|хаха)\b",
    r"\b(подпишись|реклама|казино|ставки)\b",
    r"\b(asdf|qwerty|123123)\b",
)
KEYWORD_CATEGORIES = {
    "utilities": ("свет", "электр", "вода", "отоплен", "канализац", "газ"),
    "transport": ("дорог", "яма", "светофор", "автобус", "остановк", "парков"),
    "ecology": ("мусор", "свалк", "гряз", "дым", "запах", "дерев"),
    "safety": ("опас", "авар", "пожар", "освещен", "люк", "угроза"),
    "social": ("детск", "площадк", "школ", "соц", "пособ", "доступн"),
    "healthcare": ("больниц", "поликлиник", "врач", "скорая", "мед"),
    "infrastructure": ("тротуар", "двор", "лиф", "остановоч", "здан"),
    "aryk_monitoring": ("арык", "ливнев", "подтоп", "затоп", "дренаж"),
}
SEVERITY_KEYWORDS = {
    "critical": ("угроза жизни", "горит", "пожар", "затопило", "обвал"),
    "high": ("аварийн", "опасно", "не работает", "отключили", "яма"),
    "medium": ("сломал", "поврежден", "гряз", "мусор"),
}


@dataclass
class IntakeAssessment:
    """Structured moderation and routing result for an appeal."""

    accepted: bool
    rejection_reason: str | None = None
    category_slug: str | None = None
    priority: str = "medium"
    tags: list[str] = field(default_factory=list)
    district_hint: str | None = None
    summary: str | None = None
    confidence: float | None = None


@dataclass
class PhotoAssessment:
    """Structured moderation result for a photo attached to an appeal."""

    supports_report: bool = True
    is_relevant: bool = True
    is_joke_or_meme: bool = False
    rejection_reason: str | None = None
    visual_summary: str | None = None
    confidence: float | None = None


def analyze_intake(
    *,
    text: str,
    submitted_category_slug: str | None = None,
    location_text: str | None = None,
    photo_base64: str | None = None,
) -> IntakeAssessment:
    """Moderate and classify an appeal before it is stored."""
    if not llm_service.is_llm_enabled():
        return IntakeAssessment(
            accepted=True,
            category_slug=submitted_category_slug,
            priority="medium",
            tags=[],
            district_hint=None,
            summary="LLM модели отключены. Обращение сохранено без AI-модерации.",
            confidence=None,
        )

    obvious_rejection = _detect_obvious_rejection(text)
    if obvious_rejection:
        return IntakeAssessment(
            accepted=False,
            rejection_reason=obvious_rejection,
            priority="low",
            category_slug=submitted_category_slug,
            summary=obvious_rejection,
            confidence=0.95,
        )

    categories = Category.query.order_by(Category.name.asc()).all()
    prompt = _build_intake_prompt(text, submitted_category_slug, location_text, categories)

    try:
        raw = llm_service.call_intake_analysis(prompt)
        result = _parse_json_response(raw)
        assessment = _normalize_assessment(result, text, submitted_category_slug, categories)
    except (requests.RequestException, ValueError, json.JSONDecodeError, TypeError) as exc:
        logger.warning("LLM intake analysis failed, using heuristic fallback: %s", exc)
        assessment = _heuristic_assessment(text, submitted_category_slug)

    if photo_base64 and llm_service.is_llm_enabled():
        photo_assessment = _analyze_photo(
            text=text,
            submitted_category_slug=submitted_category_slug,
            location_text=location_text,
            photo_base64=photo_base64,
        )
        if photo_assessment:
            _apply_photo_assessment(assessment, photo_assessment)
    elif photo_base64:
        logger.info("Vision analysis skipped because ENABLE_LLM=false")

    return assessment


def classify_appeal(appeal):
    """Re-run AI classification for an already stored appeal."""
    try:
        assessment = analyze_intake(
            text=appeal.text,
            submitted_category_slug=appeal.category.slug if appeal.category else None,
            location_text=appeal.location_text,
        )
        apply_assessment_to_appeal(appeal, assessment)
        if assessment.accepted and appeal.status == "new":
            appeal.status = "processing"
        db.session.commit()
        logger.info("Appeal %d classified: accepted=%s", appeal.id, assessment.accepted)
    except Exception as exc:
        logger.error("Classification failed for appeal %d: %s", appeal.id, exc)
        appeal.ai_summary = "Не удалось завершить AI-анализ обращения."
        appeal.ai_tags = []
        db.session.commit()


def apply_assessment_to_appeal(
    appeal,
    assessment: IntakeAssessment,
    *,
    fallback_district=None,
) -> None:
    """Apply moderation and routing results to the appeal model."""
    appeal.ai_summary = assessment.summary or _build_ai_summary(
        {
            "category": assessment.category_slug,
            "priority": assessment.priority,
            "district_hint": assessment.district_hint,
        },
        assessment.tags,
        fallback_text=appeal.text,
    )
    appeal.ai_tags = assessment.tags
    appeal.priority = assessment.priority if assessment.priority in VALID_PRIORITIES else "medium"

    if assessment.category_slug:
        category = Category.query.filter_by(slug=assessment.category_slug).first()
        if category:
            appeal.category_id = category.id

    district = fallback_district or match_district(assessment.district_hint)
    if district:
        appeal.district_id = district.id

    if not assessment.accepted:
        appeal.status = "rejected"


def _analyze_photo(
    *,
    text: str,
    submitted_category_slug: str | None,
    location_text: str | None,
    photo_base64: str,
) -> PhotoAssessment | None:
    if not llm_service.is_llm_enabled():
        logger.info("Vision analysis skipped because ENABLE_LLM=false")
        return None

    prompt = _build_photo_prompt(text, submitted_category_slug, location_text)

    try:
        raw = llm_service.call_vision_analysis(prompt, [photo_base64])
        result = _parse_json_response(raw)
    except (requests.RequestException, ValueError, json.JSONDecodeError, TypeError) as exc:
        logger.warning("Vision analysis failed, continuing with text-only moderation: %s", exc)
        return None

    return _normalize_photo_assessment(result)


def _apply_photo_assessment(
    assessment: IntakeAssessment,
    photo_assessment: PhotoAssessment,
) -> None:
    if photo_assessment.visual_summary:
        assessment.summary = _merge_summaries(assessment.summary, photo_assessment.visual_summary)

    should_reject = photo_assessment.is_joke_or_meme or (
        (not photo_assessment.supports_report or not photo_assessment.is_relevant)
        and (photo_assessment.confidence or 0) >= 0.55
    )
    if should_reject:
        assessment.accepted = False
        assessment.rejection_reason = (
            photo_assessment.rejection_reason
            or "Обращение отклонено: приложенное фото не подтверждает описанную проблему."
        )


def _build_intake_prompt(
    text: str,
    submitted_category_slug: str | None,
    location_text: str | None,
    categories: list[Category],
) -> str:
    category_list = "\n".join(f'- "{category.slug}": {category.name}' for category in categories)
    return f"""Ты анализируешь обращения граждан по городским проблемам.
Верни только JSON без пояснений.

Доступные категории:
{category_list}

Нужно определить:
1. Является ли сообщение реальной городской проблемой.
2. Не является ли оно шуткой, спамом, тестом, рекламой, бессмысленным текстом или сообщением не по теме.
3. Самую подходящую категорию из списка.
4. Приоритет и короткую AI-сводку.

Формат ответа:
{{
  "accepted": true,
  "rejection_reason": null,
  "category": "transport",
  "priority": "medium",
  "tags": ["яма", "дорога"],
  "district_hint": null,
  "summary": "1-2 предложения для сотрудников",
  "confidence": 0.92
}}

Правила:
- accepted=false, если это розыгрыш, тест, спам, реклама, оффтоп, бессодержательное сообщение или в тексте нет городской проблемы.
- category должна быть только одной из доступных категорий.
- priority только low, medium, high или critical.
- summary должна быть деловой, краткой и полезной для обработки.

Подсказка пользователя по категории: {submitted_category_slug or "не указана"}
Указанный адрес: {location_text or "не указан"}

Текст обращения:
\"\"\"{text}\"\"\""""


def _build_photo_prompt(
    text: str,
    submitted_category_slug: str | None,
    location_text: str | None,
) -> str:
    return f"""Ты анализируешь фото, приложенное к обращению гражданина.
Верни только JSON без пояснений.

Твоя задача:
1. Понять, является ли фото реальным уместным доказательством городской проблемы.
2. Выявить мемы, шуточные картинки, коллажи, стикеры, скриншоты чатов, нерелевантные изображения и заведомо несерьёзный контент.
3. Сопоставить фото с описанием проблемы.

Формат ответа:
{{
  "supports_report": true,
  "is_relevant": true,
  "is_joke_or_meme": false,
  "rejection_reason": null,
  "visual_summary": "Кратко, что видно на фото",
  "confidence": 0.81
}}

Правила:
- supports_report=false, если фото не выглядит реальным доказательством проблемы.
- is_relevant=false, если фото не связано с описанием обращения.
- is_joke_or_meme=true, если это мем, шутка, развлекательная картинка, постер, рисунок, скриншот переписки или иной несерьёзный контент.
- Если фото шуточное или нерелевантное, обязательно заполни rejection_reason.

Категория от пользователя: {submitted_category_slug or "не указана"}
Адрес: {location_text or "не указан"}
Текст обращения:
\"\"\"{text}\"\"\""""


def _normalize_assessment(
    result: dict,
    text: str,
    submitted_category_slug: str | None,
    categories: list[Category],
) -> IntakeAssessment:
    allowed_categories = {category.slug for category in categories}
    category_slug = result.get("category")
    if category_slug not in allowed_categories:
        category_slug = _guess_category_from_keywords(text, submitted_category_slug, allowed_categories)

    priority = result.get("priority")
    if priority not in VALID_PRIORITIES:
        priority = _guess_priority(text)

    accepted = _coerce_bool(result.get("accepted", True), default=True)
    rejection_reason = _clean_text(result.get("rejection_reason"))
    if not accepted and not rejection_reason:
        rejection_reason = "Обращение не похоже на реальную городскую проблему."

    tags = _normalize_tags(result.get("tags"))
    summary = _build_ai_summary(
        {
            "summary": result.get("summary"),
            "category": category_slug,
            "priority": priority,
            "district_hint": result.get("district_hint"),
        },
        tags,
        fallback_text=text,
    )

    return IntakeAssessment(
        accepted=accepted,
        rejection_reason=rejection_reason,
        category_slug=category_slug,
        priority=priority,
        tags=tags,
        district_hint=_clean_text(result.get("district_hint")),
        summary=summary,
        confidence=_normalize_confidence(result.get("confidence")),
    )


def _normalize_photo_assessment(result: dict) -> PhotoAssessment:
    supports_report = _coerce_bool(result.get("supports_report", True), default=True)
    is_relevant = _coerce_bool(result.get("is_relevant", True), default=True)
    is_joke_or_meme = _coerce_bool(result.get("is_joke_or_meme", False), default=False)
    rejection_reason = _clean_text(result.get("rejection_reason"))
    if (is_joke_or_meme or not supports_report or not is_relevant) and not rejection_reason:
        rejection_reason = "Обращение отклонено: приложенное фото выглядит шуточным или не относится к проблеме."

    return PhotoAssessment(
        supports_report=supports_report,
        is_relevant=is_relevant,
        is_joke_or_meme=is_joke_or_meme,
        rejection_reason=rejection_reason,
        visual_summary=_clean_text(result.get("visual_summary") or result.get("summary")),
        confidence=_normalize_confidence(result.get("confidence")),
    )


def _heuristic_assessment(text: str, submitted_category_slug: str | None) -> IntakeAssessment:
    rejection_reason = _detect_obvious_rejection(text)
    if rejection_reason:
        return IntakeAssessment(
            accepted=False,
            rejection_reason=rejection_reason,
            priority="low",
            category_slug=submitted_category_slug,
            summary=rejection_reason,
            confidence=0.78,
        )

    allowed_categories = {category.slug for category in Category.query.all()}
    category_slug = _guess_category_from_keywords(text, submitted_category_slug, allowed_categories)
    priority = _guess_priority(text)
    tags = _extract_tags(text)
    district = match_district(text)

    return IntakeAssessment(
        accepted=True,
        category_slug=category_slug,
        priority=priority,
        tags=tags,
        district_hint=district.name if district else None,
        summary=_build_ai_summary(
            {
                "category": category_slug,
                "priority": priority,
                "district_hint": district.name if district else None,
            },
            tags,
            fallback_text=text,
        ),
        confidence=0.46,
    )


def _normalize_tags(raw_tags) -> list[str]:
    if not isinstance(raw_tags, list):
        return []

    tags: list[str] = []
    seen: set[str] = set()
    for item in raw_tags:
        if not isinstance(item, str):
            continue
        cleaned = item.strip()
        if not cleaned:
            continue
        key = cleaned.casefold()
        if key in seen:
            continue
        seen.add(key)
        tags.append(cleaned)

    return tags[:6]


def _build_ai_summary(result: dict, tags: list[str], fallback_text: str | None = None) -> str:
    summary = result.get("summary")
    if isinstance(summary, str) and summary.strip():
        return summary.strip()

    category = result.get("category", "unknown")
    priority = result.get("priority", "medium")
    parts = [f"Категория: {category}.", f"Приоритет: {priority}."]
    if tags:
        parts.append(f"Ключевые теги: {', '.join(tags)}.")
    district_hint = result.get("district_hint")
    if isinstance(district_hint, str) and district_hint.strip():
        parts.append(f"Вероятный район: {district_hint.strip()}.")
    if fallback_text:
        parts.append(f"Суть: {fallback_text[:180].strip()}.")
    return " ".join(parts)


def _merge_summaries(base_summary: str | None, extra_summary: str) -> str:
    if not base_summary:
        return extra_summary
    if extra_summary in base_summary:
        return base_summary
    return f"{base_summary} Фото: {extra_summary}"


def _parse_json_response(raw: str) -> dict:
    """Extract and parse JSON from LLM response text."""
    raw = raw.strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass

    if "```" in raw:
        start = raw.find("{")
        end = raw.rfind("}") + 1
        if start != -1 and end > start:
            return json.loads(raw[start:end])

    start = raw.find("{")
    end = raw.rfind("}") + 1
    if start != -1 and end > start:
        return json.loads(raw[start:end])
    raise ValueError(f"Could not parse JSON from LLM response: {raw[:200]}")


def _detect_obvious_rejection(text: str) -> str | None:
    normalized = text.casefold()
    for pattern in PRANK_PATTERNS:
        if re.search(pattern, normalized):
            return "Обращение отклонено: сообщение похоже на тест, шутку или спам."

    compact = re.sub(r"\W+", "", normalized)
    if compact and len(set(compact)) <= 3:
        return "Обращение отклонено: сообщение выглядит бессодержательным."

    return None


def _guess_category_from_keywords(
    text: str,
    submitted_category_slug: str | None,
    allowed_categories: set[str],
) -> str | None:
    normalized = text.casefold()
    for slug, keywords in KEYWORD_CATEGORIES.items():
        if slug not in allowed_categories:
            continue
        if any(keyword in normalized for keyword in keywords):
            return slug

    if submitted_category_slug in allowed_categories:
        return submitted_category_slug

    return next(iter(sorted(allowed_categories)), None)


def _guess_priority(text: str) -> str:
    normalized = text.casefold()
    for priority, keywords in SEVERITY_KEYWORDS.items():
        if any(keyword in normalized for keyword in keywords):
            return priority
    return "medium"


def _extract_tags(text: str) -> list[str]:
    tags: list[str] = []
    seen: set[str] = set()
    for word in re.findall(r"[A-Za-zА-Яа-яЁё0-9-]{4,}", text):
        key = word.casefold()
        if key in seen:
            continue
        seen.add(key)
        tags.append(word)
        if len(tags) == 5:
            break
    return tags


def _clean_text(value) -> str | None:
    if not isinstance(value, str):
        return None
    cleaned = " ".join(value.split()).strip()
    return cleaned or None


def _normalize_confidence(value) -> float | None:
    if isinstance(value, (int, float)):
        if 0 <= float(value) <= 1:
            return round(float(value), 2)
    return None


def _coerce_bool(value, *, default: bool = False) -> bool:
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        normalized = value.strip().casefold()
        if normalized in {"false", "0", "no", "нет"}:
            return False
        if normalized in {"true", "1", "yes", "да"}:
            return True
    return bool(value)
