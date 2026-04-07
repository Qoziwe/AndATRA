"""Compatibility wrapper for Render monorepo startup from repo root."""

from pathlib import Path
import runpy
import traceback


BACKEND_START = Path(__file__).resolve().parent.parent / "backend" / "scripts" / "render_start.py"


if __name__ == "__main__":
    print(f"Delegating Render startup to {BACKEND_START}", flush=True)
    try:
        runpy.run_path(str(BACKEND_START), run_name="__main__")
    except BaseException:  # pragma: no cover - startup diagnostics only
        traceback.print_exc()
        raise
