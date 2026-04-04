"""Check reachability of configured Ollama nodes."""

from __future__ import annotations

import json
import sys
import os
from pathlib import Path

import requests
from dotenv import load_dotenv


ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env")

SESSION = requests.Session()
SESSION.trust_env = False


def _model_matches(target: str, available: set[str]) -> bool:
    """Treat bare names and :latest tags as equivalent for Ollama checks."""
    normalized = {name.strip() for name in available if name}
    if target in normalized:
        return True
    if f"{target}:latest" in normalized:
        return True
    return False


def _check_node(label: str, base_url: str, model: str) -> bool:
    url = f"{base_url.rstrip('/')}/api/tags"
    print(f"[{label}] {url}  model={model}")
    try:
        response = SESSION.get(url, timeout=10)
        response.raise_for_status()
        payload = response.json()
        models = payload.get("models", [])
        names = {item.get("name") or item.get("model") for item in models}
        present = _model_matches(model, names)
        print(f"  reachable: yes")
        print(f"  models: {', '.join(sorted(n for n in names if n)) or '(none)'}")
        print(f"  target model present:     {'yes' if present else 'no'}")
        return present
    except requests.RequestException as exc:
        print(f"  reachable: no ({exc})")
        return False
    except json.JSONDecodeError as exc:
        print(f"  invalid JSON response: {exc}")
        return False


def main() -> int:
    checks = [
        ("PRIMARY", os.environ.get("LLM_PRIMARY_URL", ""), os.environ.get("LLM_PRIMARY_MODEL", "")),
        ("CLASSIFY", os.environ.get("LLM_CLASSIFY_URL", ""), os.environ.get("LLM_CLASSIFY_MODEL", "")),
    ]

    missing = [label for label, url, model in checks if not url or not model]
    if missing:
        print(f"Missing LLM configuration for: {', '.join(missing)}")
        return 1

    statuses = [_check_node(label, url, model) for label, url, model in checks]
    return 0 if all(statuses) else 1


if __name__ == "__main__":
    raise SystemExit(main())
