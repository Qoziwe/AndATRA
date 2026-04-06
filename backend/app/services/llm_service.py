"""LLM service that routes inference tasks to Ollama nodes on the LAN."""

from __future__ import annotations

import logging

import requests
from flask import current_app

logger = logging.getLogger(__name__)

SESSION = requests.Session()
SESSION.trust_env = False
_MODEL_NAME_CACHE: dict[tuple[str, str], str] = {}


class LLMDisabledError(RuntimeError):
    """Raised when LLM-backed features are disabled by configuration."""


def _model_matches(requested: str, available: str) -> bool:
    """Treat bare names and tagged Ollama names as compatible aliases."""
    requested_name = (requested or "").strip().lower()
    available_name = (available or "").strip().lower()

    if not requested_name or not available_name:
        return False
    if requested_name == available_name:
        return True
    if available_name == f"{requested_name}:latest":
        return True
    if requested_name == f"{available_name}:latest":
        return True
    if ":" not in requested_name and available_name.startswith(f"{requested_name}:"):
        return True
    return False


def _get_config(name: str, default):
    """Read config inside or outside an app context."""
    try:
        return current_app.config.get(name, default)
    except RuntimeError:
        return default


def is_llm_enabled() -> bool:
    """Return whether LLM-backed features are enabled."""
    return bool(_get_config("ENABLE_LLM", True))


def _require_llm_enabled() -> None:
    if not is_llm_enabled():
        raise LLMDisabledError("LLM models are disabled.")


def _resolve_model_name(base_url: str, requested_model: str) -> str:
    """Resolve a configured model name to the exact Ollama tag when possible."""
    cache_key = (base_url.rstrip("/"), requested_model)
    cached_model = _MODEL_NAME_CACHE.get(cache_key)
    if cached_model:
        return cached_model

    url = f"{base_url.rstrip('/')}/api/tags"
    try:
        response = SESSION.get(
            url,
            timeout=_get_config("LLM_MODEL_RESOLUTION_TIMEOUT", 2),
        )
        response.raise_for_status()
        payload = response.json()
    except (requests.RequestException, ValueError):
        return requested_model

    available_models = [
        item.get("name") or item.get("model")
        for item in payload.get("models", [])
        if item.get("name") or item.get("model")
    ]
    if not available_models:
        return requested_model

    for candidate in available_models:
        if candidate == requested_model:
            _MODEL_NAME_CACHE[cache_key] = candidate
            return candidate

    for candidate in available_models:
        if _model_matches(requested_model, candidate):
            _MODEL_NAME_CACHE[cache_key] = candidate
            return candidate

    return requested_model


def _call_ollama(
    base_url: str,
    model: str,
    prompt: str,
    system_prompt: str | None = None,
    *,
    images: list[str] | None = None,
    timeout: float | None = None,
) -> str:
    """Call Ollama /api/generate and return the response text."""
    resolved_model = _resolve_model_name(base_url, model)
    payload = {
        "model": resolved_model,
        "prompt": prompt,
        "stream": False,
    }
    if system_prompt:
        payload["system"] = system_prompt
    if images:
        payload["images"] = images

    try:
        response = SESSION.post(
            f"{base_url.rstrip('/')}/api/generate",
            json=payload,
            timeout=timeout if timeout is not None else _get_config("LLM_PRIMARY_TIMEOUT", 45),
        )
        response.raise_for_status()
        return response.json().get("response", "")
    except requests.RequestException as exc:
        logger.error(
            "Ollama call failed at %s using model %s: %s",
            base_url,
            resolved_model,
            exc,
        )
        raise


def _call_with_fallback(
    base_url: str,
    model: str,
    prompt: str,
    system_prompt: str | None = None,
    *,
    fallback_url: str | None = None,
    fallback_model: str | None = None,
    label: str,
    images: list[str] | None = None,
    timeout: float | None = None,
    fallback_timeout: float | None = None,
) -> str:
    """Call a preferred node and optionally retry on a fallback node."""
    try:
        return _call_ollama(
            base_url,
            model,
            prompt,
            system_prompt,
            images=images,
            timeout=timeout,
        )
    except requests.RequestException:
        if not fallback_url or not fallback_model:
            raise
        if fallback_url == base_url and fallback_model == model:
            raise

        logger.warning("%s unavailable, switching to fallback node", label)
        return _call_ollama(
            fallback_url,
            fallback_model,
            prompt,
            system_prompt,
            images=images,
            timeout=fallback_timeout if fallback_timeout is not None else timeout,
        )


def call_primary(prompt: str, system_prompt: str | None = None) -> str:
    """Call the primary LLM node for general chat."""
    _require_llm_enabled()

    url = current_app.config["LLM_PRIMARY_URL"]
    model = current_app.config["LLM_PRIMARY_MODEL"]
    return _call_ollama(
        url,
        model,
        prompt,
        system_prompt,
        timeout=current_app.config["LLM_PRIMARY_TIMEOUT"],
    )


def call_classify(prompt: str) -> str:
    """Call the classification node and fall back to the primary node."""
    _require_llm_enabled()

    return _call_with_fallback(
        current_app.config["LLM_CLASSIFY_URL"],
        current_app.config["LLM_CLASSIFY_MODEL"],
        prompt,
        fallback_url=current_app.config["LLM_PRIMARY_URL"],
        fallback_model=current_app.config["LLM_PRIMARY_MODEL"],
        label="Classification node",
        timeout=current_app.config["LLM_CLASSIFY_TIMEOUT"],
        fallback_timeout=current_app.config["LLM_PRIMARY_TIMEOUT"],
    )


def call_intake_analysis(prompt: str, system_prompt: str | None = None) -> str:
    """Run high-accuracy intake analysis on the primary node with classify fallback."""
    _require_llm_enabled()

    return _call_with_fallback(
        current_app.config["LLM_PRIMARY_URL"],
        current_app.config["LLM_PRIMARY_MODEL"],
        prompt,
        system_prompt,
        fallback_url=current_app.config["LLM_CLASSIFY_URL"],
        fallback_model=current_app.config["LLM_CLASSIFY_MODEL"],
        label="Intake analysis node",
        timeout=current_app.config["LLM_INTAKE_TIMEOUT"],
        fallback_timeout=current_app.config["LLM_INTAKE_TIMEOUT"],
    )


def call_vision_analysis(
    prompt: str,
    images: list[str],
    system_prompt: str | None = None,
) -> str:
    """Run multimodal analysis for appeal photos."""
    _require_llm_enabled()

    return _call_ollama(
        current_app.config["LLM_VISION_URL"],
        current_app.config["LLM_VISION_MODEL"],
        prompt,
        system_prompt,
        images=images,
        timeout=current_app.config["LLM_VISION_TIMEOUT"],
    )
