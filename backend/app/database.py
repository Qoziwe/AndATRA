"""Database URL normalization and SQLAlchemy engine helpers."""

from __future__ import annotations

from collections.abc import Iterable

from sqlalchemy import inspect
from sqlalchemy.engine import Engine, make_url
from sqlalchemy.pool import StaticPool

DEFAULT_DATABASE_URL = "postgresql+psycopg://postgres:postgres@localhost:5432/andatra"
REQUIRED_SCHEMA_TABLES = ("categories", "districts", "appeals", "chat_logs")


def normalize_database_url(raw_url: str | None) -> str:
    """Normalize environment-provided DB URLs for SQLAlchemy."""
    candidate = (raw_url or "").strip()
    if not candidate:
        return DEFAULT_DATABASE_URL

    if candidate.startswith("postgres://"):
        return candidate.replace("postgres://", "postgresql+psycopg://", 1)

    if candidate.startswith("postgresql://"):
        return candidate.replace("postgresql://", "postgresql+psycopg://", 1)

    return candidate


def build_engine_options(database_url: str) -> dict:
    """Return engine options tuned for the configured database backend."""
    normalized_url = normalize_database_url(database_url)
    parsed_url = make_url(normalized_url)
    options: dict = {}

    if parsed_url.drivername.startswith("postgresql"):
        options["pool_pre_ping"] = True
        options["pool_recycle"] = 1800
        return options

    if parsed_url.drivername.startswith("sqlite"):
        options["connect_args"] = {"check_same_thread": False}
        if parsed_url.database in {"", None, ":memory:"}:
            options["poolclass"] = StaticPool

    return options


def schema_has_required_tables(
    engine: Engine,
    required_tables: Iterable[str] = REQUIRED_SCHEMA_TABLES,
) -> bool:
    """Check whether the current database already has the expected app schema."""
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())
    return set(required_tables).issubset(existing_tables)
