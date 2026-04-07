"""Render free-tier startup helper.

Runs database migrations on boot, optionally seeds mock data, and then
launches Gunicorn. Render Free does not support preDeployCommand, so we keep
this bootstrap logic in the service start command instead.
"""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parent.parent


def run_step(args: list[str]) -> None:
    """Run a startup step and fail fast on errors."""
    print(f"Running: {' '.join(args)}", flush=True)
    subprocess.run(args, cwd=ROOT_DIR, check=True)


def main() -> None:
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
    main()
