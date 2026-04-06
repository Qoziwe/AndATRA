"""Traffic analysis service — fetches TomTom data and generates LLM-based recommendations."""

from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timezone

import requests

from app.services import llm_service

logger = logging.getLogger(__name__)

SESSION = requests.Session()
SESSION.trust_env = False

TOMTOM_API_KEY = os.getenv("TOMTOM_API_KEY", "")
TOMTOM_FLOW_BASE = "https://api.tomtom.com/traffic/services/4/flowSegmentData/relative0/10/json"

ALMATY_INTERSECTIONS = [
    {
        "id": "alfarabi-seifullina",
        "name": "Аль-Фараби / Сейфуллина",
        "streets": ["пр. Аль-Фараби", "ул. Сейфуллина"],
        "lat": 43.2180,
        "lng": 76.9292,
    },
    {
        "id": "abaya-dostyk",
        "name": "Абая / Достык",
        "streets": ["пр. Абая", "пр. Достык"],
        "lat": 43.2381,
        "lng": 76.9537,
    },
    {
        "id": "raiymbeka-seifullina",
        "name": "Райымбека / Сейфуллина",
        "streets": ["пр. Райымбека", "ул. Сейфуллина"],
        "lat": 43.2617,
        "lng": 76.9300,
    },
    {
        "id": "tole-bi-nazarbayeva",
        "name": "Толе Би / Назарбаева",
        "streets": ["ул. Толе Би", "ул. Назарбаева"],
        "lat": 43.2564,
        "lng": 76.9447,
    },
    {
        "id": "abaya-seifullina",
        "name": "Абая / Сейфуллина",
        "streets": ["пр. Абая", "ул. Сейфуллина"],
        "lat": 43.2388,
        "lng": 76.9290,
    },
    {
        "id": "zhandosova-timiryazeva",
        "name": "Жандосова / Тимирязева",
        "streets": ["ул. Жандосова", "ул. Тимирязева"],
        "lat": 43.2148,
        "lng": 76.9076,
    },
    {
        "id": "alfarabi-momyshuly",
        "name": "Аль-Фараби / Момышулы",
        "streets": ["пр. Аль-Фараби", "ул. Момышулы"],
        "lat": 43.2200,
        "lng": 76.8564,
    },
    {
        "id": "raiymbeka-tashkentskaya",
        "name": "Райымбека / Ташкентская",
        "streets": ["пр. Райымбека", "ул. Ташкентская"],
        "lat": 43.2780,
        "lng": 76.9690,
    },
    {
        "id": "gagarina-timiryazeva",
        "name": "Гагарина / Тимирязева",
        "streets": ["пр. Гагарина", "ул. Тимирязева"],
        "lat": 43.2340,
        "lng": 76.9080,
    },
    {
        "id": "satpayeva-masanchi",
        "name": "Сатпаева / Масанчи",
        "streets": ["ул. Сатпаева", "ул. Масанчи"],
        "lat": 43.2321,
        "lng": 76.9400,
    },
    {
        "id": "rozybakieva-alfarabi",
        "name": "Розыбакиева / Аль-Фараби",
        "streets": ["ул. Розыбакиева", "пр. Аль-Фараби"],
        "lat": 43.2192,
        "lng": 76.9166,
    },
    {
        "id": "abaya-nazarbayeva",
        "name": "Абая / Назарбаева",
        "streets": ["пр. Абая", "ул. Назарбаева"],
        "lat": 43.2420,
        "lng": 76.9451,
    },
]



def _fetch_tomtom_flow(lat: float, lng: float) -> dict | None:
    """Fetch traffic flow segment data from TomTom for a single point."""
    if not TOMTOM_API_KEY:
        return None

    try:
        response = SESSION.get(
            TOMTOM_FLOW_BASE,
            params={
                "key": TOMTOM_API_KEY,
                "point": f"{lat},{lng}",
                "unit": "KMPH",
            },
            timeout=8,
        )
        response.raise_for_status()
        flow = response.json().get("flowSegmentData", {})
        return {
            "currentSpeed": flow.get("currentSpeed", 0),
            "freeFlowSpeed": flow.get("freeFlowSpeed", 0),
            "currentTravelTime": flow.get("currentTravelTime", 0),
            "freeFlowTravelTime": flow.get("freeFlowTravelTime", 0),
            "confidence": flow.get("confidence", 0),
        }
    except requests.RequestException as exc:
        logger.warning("TomTom flow request failed for (%s, %s): %s", lat, lng, exc)
        return None


def _build_traffic_context(flow_data: list[dict]) -> str:
    """Build a context string from raw traffic flow data for the LLM prompt."""
    lines = [
        f"Текущее время: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}",
        f"Город: Алматы, Казахстан",
        f"Количество перекрёстков: {len(flow_data)}",
        "",
    ]
    for item in flow_data:
        congestion = 0
        if item["freeFlowSpeed"] > 0:
            congestion = round((1 - item["currentSpeed"] / item["freeFlowSpeed"]) * 100)
        lines.append(
            f"Перекрёсток: {item['name']} ({', '.join(item['streets'])})\n"
            f"  Скорость: {item['currentSpeed']} км/ч (свободная: {item['freeFlowSpeed']} км/ч)\n"
            f"  Загрузка: {max(0, congestion)}%\n"
            f"  Время проезда: {item['currentTravelTime']}c (свободное: {item['freeFlowTravelTime']}с)"
        )
    return "\n".join(lines)


TRAFFIC_SYSTEM_PROMPT = """Ты — экспертная нейросеть AndATRA для анализа дорожного трафика города Алматы.
Твоя задача — анализировать данные пробок по перекрёсткам и давать ТОЧНЫЕ рекомендации по изменению
длительности сигналов светофоров.

Для каждого загруженного перекрёстка (загрузка > 30%) ты должен выдать:
1. Уровень severity: "critical" (>70%), "high" (50-70%), "medium" (30-50%), "low" (<30%)
2. Конкретную рекомендацию: какой улице добавить зелёную фазу и на сколько секунд, какой уменьшить
3. Обоснование решения на основе скорости потока и загрузки

Ответ СТРОГО в JSON формате:
{
  "recommendations": [
    {
      "intersection_id": "string",
      "intersection_name": "string",
      "severity": "critical|high|medium|low",
      "current_speed_kmh": number,
      "free_flow_speed_kmh": number,
      "congestion_percent": number,
      "recommendation": "Текст рекомендации по фазам светофора",
      "reasoning": "Обоснование",
      "streets": ["улица1", "улица2"]
    }
  ]
}

Отвечай ТОЛЬКО JSON без markdown-обёртки. Включи ВСЕ перекрёстки, даже те где загрузка низкая."""


TRAFFIC_CHAT_SYSTEM_PROMPT = """Ты — экспертный ИИ-ассистент платформы AndATRA по управлению дорожным трафиком Алматы.
Ты анализируешь данные пробок, светофоры и транспортные потоки.
Отвечай на русском языке, кратко и по делу. Используй актуальные данные о пробках ниже.

{context}"""


def analyze_traffic() -> dict:
    """Fetch traffic data and generate LLM-based recommendations."""
    gemini_key = ""
    try:
        from flask import current_app
        gemini_key = current_app.config.get("GEMINI_API_KEY", "")
    except RuntimeError:
        pass

    # Fetch live data from TomTom
    flow_data = []
    for intersection in ALMATY_INTERSECTIONS:
        flow = _fetch_tomtom_flow(intersection["lat"], intersection["lng"])
        if flow:
            flow_data.append({**intersection, **flow})

    now = datetime.now(timezone.utc).isoformat()

    if not flow_data:
        logger.info("Traffic analysis: no TomTom data available")
        return {"recommendations": []}

    if not llm_service.is_llm_enabled():
        logger.info("Traffic analysis: LLM disabled, using deterministic recommendations")
        return _deterministic_analysis(flow_data, now)

    # Build context and call LLM
    context = _build_traffic_context(flow_data)
    prompt = f"Проанализируй текущие пробки Алматы и дай рекомендации по светофорам:\n\n{context}"

    try:
        if gemini_key:
            raw_response = _call_gemini(prompt, TRAFFIC_SYSTEM_PROMPT, gemini_key)
        else:
            raw_response = llm_service.call_primary(prompt, TRAFFIC_SYSTEM_PROMPT)
        # Attempt to parse JSON from LLM response
        cleaned = raw_response.strip()
        if cleaned.startswith("```"):
            cleaned = "\n".join(cleaned.split("\n")[1:])
        if cleaned.endswith("```"):
            cleaned = cleaned[: cleaned.rfind("```")]
        parsed = json.loads(cleaned.strip())

        for rec in parsed.get("recommendations", []):
            rec["timestamp"] = now

        return parsed
    except (json.JSONDecodeError, Exception) as exc:
        logger.warning("LLM traffic analysis parse failed, using deterministic fallback: %s", exc)
        return _deterministic_analysis(flow_data, now)


def _deterministic_analysis(flow_data: list[dict], timestamp: str) -> dict:
    """Fallback deterministic analysis when LLM response isn't parseable."""
    recommendations = []
    for item in flow_data:
        free_flow = item.get("freeFlowSpeed", 50)
        current = item.get("currentSpeed", free_flow)
        congestion = max(0, round((1 - current / max(free_flow, 1)) * 100))

        if congestion >= 70:
            severity = "critical"
            extra_green = min(30, round(congestion * 0.35))
            reduce_green = min(25, round(congestion * 0.28))
        elif congestion >= 50:
            severity = "high"
            extra_green = min(20, round(congestion * 0.3))
            reduce_green = min(15, round(congestion * 0.22))
        elif congestion >= 30:
            severity = "medium"
            extra_green = min(12, round(congestion * 0.25))
            reduce_green = min(10, round(congestion * 0.18))
        else:
            severity = "low"
            extra_green = 0
            reduce_green = 0

        streets = item.get("streets", ["ул. A", "ул. B"])
        if extra_green > 0:
            recommendation = (
                f"Увеличить зелёную фазу для {streets[0]} на +{extra_green} секунд, "
                f"сократить зелёную фазу для {streets[1]} на −{reduce_green} секунд."
            )
            reasoning = (
                f"Скорость потока {current} км/ч при свободном потоке {free_flow} км/ч. "
                f"Загрузка {congestion}%. Основной поток идёт по {streets[0]}."
            )
        else:
            recommendation = "Текущие фазы оптимальны. Изменения не требуются."
            reasoning = f"Поток движется со скоростью {current} км/ч при свободной {free_flow} км/ч. Загрузка минимальная ({congestion}%)."

        recommendations.append({
            "intersection_id": item["id"],
            "intersection_name": item["name"],
            "severity": severity,
            "current_speed_kmh": current,
            "free_flow_speed_kmh": free_flow,
            "congestion_percent": congestion,
            "recommendation": recommendation,
            "reasoning": reasoning,
            "streets": streets,
            "timestamp": timestamp,
        })

    recommendations.sort(key=lambda r: r["congestion_percent"], reverse=True)
    return {"recommendations": recommendations}


def handle_traffic_chat(message: str, history: list[dict] | None = None, traffic_context: str = "") -> dict:
    """Handle a traffic-specific chat message using the LLM with traffic context."""
    gemini_key = ""
    try:
        from flask import current_app
        gemini_key = current_app.config.get("GEMINI_API_KEY", "")
    except RuntimeError:
        pass

    system_prompt = TRAFFIC_CHAT_SYSTEM_PROMPT.format(
        context=traffic_context or "Данные пробок временно недоступны."
    )

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

    if not llm_service.is_llm_enabled():
        return {
            "id": None,
            "role": "assistant",
            "content": "LLM модели отключены.",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

    try:
        if gemini_key:
            response = _call_gemini(full_prompt, system_prompt, gemini_key)
        else:
            response = llm_service.call_primary(full_prompt, system_prompt)
    except Exception as exc:
        logger.error("Traffic chat LLM call failed: %s", exc)
        response = "Сейчас нет связи с нейросетью. Попробуйте позже."

    return {
        "id": None,
        "role": "assistant",
        "content": response,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }


def _call_gemini(prompt: str, system_prompt: str, api_key: str) -> str:
    """Make a direct HTTP request to the Gemini API."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    payload = {
        "systemInstruction": {
            "parts": [{"text": system_prompt}]
        },
        "contents": [
            {
                "parts": [{"text": prompt}]
            }
        ],
        "generationConfig": {
            "temperature": 0.2
        }
    }
    
    try:
        response = SESSION.post(url, json=payload, timeout=20)
        response.raise_for_status()
        data = response.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except Exception as exc:
        logger.error("Gemini API call failed: %s", exc)
        raise
