"""Compatibility wrapper for Render monorepo startup from repo root."""

from pathlib import Path
import runpy


BACKEND_START = Path(__file__).resolve().parent.parent / "backend" / "scripts" / "render_start.py"


if __name__ == "__main__":
    runpy.run_path(str(BACKEND_START), run_name="__main__")
