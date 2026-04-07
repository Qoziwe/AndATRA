"""Render free-tier startup helper.

Runs database migrations on boot, optionally seeds mock data, and then
launches Gunicorn. Render Free does not support preDeployCommand, so we keep
this bootstrap logic in the service start command instead.
"""

from __future__ import annotations

import os
import subprocess
import sys
import traceback
from pathlib import Path
from urllib.parse import urlparse


ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from app.database import DEFAULT_DATABASE_URL, normalize_database_url


def run_step(args: list[str]) -> None:
    """Run a startup step and fail fast on errors."""
    print(f"Running: {' '.join(args)}", flush=True)
    subprocess.run(args, cwd=ROOT_DIR, check=True)


def validate_render_database_url() -> None:
    """Fail fast with a clear error when DATABASE_URL was not configured on Render."""
    raw_database_url = os.getenv("DATABASE_URL", "")
    print(
        "DATABASE_URL presence:",
        "set" if "DATABASE_URL" in os.environ else "missing",
        f"(length={len(raw_database_url.strip())})",
        flush=True,
    )
    if raw_database_url.strip():
        parsed = urlparse(raw_database_url)
        print(
            "DATABASE_URL target:",
            f"scheme={parsed.scheme or 'n/a'} host={parsed.hostname or 'n/a'} db={parsed.path.lstrip('/') or 'n/a'}",
            flush=True,
        )
    normalized_database_url = normalize_database_url(raw_database_url)
    if not raw_database_url.strip() or normalized_database_url == DEFAULT_DATABASE_URL:
        message = (
            "DATABASE_URL is missing in Render env. Set it to your Render Postgres "
            "Internal Database URL before deploy."
        )
        print(message, flush=True)
        raise RuntimeError(message)


def main() -> None:
    print(f"Render backend startup from {ROOT_DIR}", flush=True)
    validate_render_database_url()
    run_step([sys.executable, "-m", "alembic", "upgrade", "head"])
    run_step([sys.executable, "-m", "app.data.seed", "--on-deploy"])

    os.chdir(ROOT_DIR)
    gunicorn_args = [
        sys.executable,
        "-m",
        "gunicorn",
        "--worker-class",
        os.getenv("GUNICORN_WORKER_CLASS", "eventlet"),
        "--workers",
        os.getenv("GUNICORN_WORKERS", "1"),
        "--bind",
        f"0.0.0.0:{os.getenv('PORT', '5000')}",
        "run:app",
    ]
    print("Starting Gunicorn...", flush=True)
    os.execvpe(sys.executable, gunicorn_args, os.environ)


if __name__ == "__main__":
    try:
        main()
    except BaseException:  # pragma: no cover - startup diagnostics only
        traceback.print_exc()
        raise
