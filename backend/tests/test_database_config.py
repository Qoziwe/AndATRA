"""Tests for database URL normalization and engine configuration."""

from sqlalchemy.pool import StaticPool

from app.database import build_engine_options, normalize_database_url


def test_normalize_database_url_converts_postgres_alias() -> None:
    assert normalize_database_url("postgres://user:pass@localhost:5432/andatra") == (
        "postgresql+psycopg://user:pass@localhost:5432/andatra"
    )


def test_build_engine_options_for_postgres_enables_pool_health_checks() -> None:
    options = build_engine_options("postgresql://user:pass@localhost:5432/andatra")

    assert options["pool_pre_ping"] is True
    assert options["pool_recycle"] == 1800


def test_build_engine_options_for_in_memory_sqlite_uses_static_pool() -> None:
    options = build_engine_options("sqlite+pysqlite:///:memory:")

    assert options["connect_args"] == {"check_same_thread": False}
    assert options["poolclass"] is StaticPool
