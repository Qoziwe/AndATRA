"""Bootstrap a local PostgreSQL database for AndATRA.

Typical usage:

1. Initialize a fresh PostgreSQL database and add reference data:
   python scripts/bootstrap_postgres.py

2. Initialize PostgreSQL and seed full mock data:
   python scripts/bootstrap_postgres.py --seed-mock-data

3. Initialize PostgreSQL and import data from the old SQLite file:
   python scripts/bootstrap_postgres.py --import-sqlite instance/andatra.db
"""

from __future__ import annotations

import argparse
import json
import os
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from alembic import command
from alembic.config import Config as AlembicConfig
from sqlalchemy import JSON, DateTime, MetaData, create_engine, func, inspect, select, text

ROOT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, os.fspath(ROOT_DIR))

from app import create_app
from app.config import Config
from app.data.seed import seed_all, seed_categories, seed_districts
from app.database import REQUIRED_SCHEMA_TABLES
from app.extensions import db

POSTGRES_PREFIX = "postgresql"
TABLE_COPY_ORDER = ("categories", "districts", "appeals", "chat_logs")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run Alembic migrations and optionally seed/import data into PostgreSQL."
    )
    parser.add_argument(
        "--seed-mock-data",
        action="store_true",
        help="Seed categories, districts, and mock appeals after migrations.",
    )
    parser.add_argument(
        "--import-sqlite",
        metavar="PATH_OR_URL",
        help=(
            "Import existing data from a SQLite database after migrations. "
            "Use a file path like `instance/andatra.db` or a URL like `sqlite:///...`."
        ),
    )
    return parser.parse_args()


def build_app():
    class BootstrapConfig(Config):
        AUTO_SEED_REFERENCE_DATA = False

    app = create_app(BootstrapConfig)
    database_url = app.config["SQLALCHEMY_DATABASE_URI"]

    if not database_url.startswith(POSTGRES_PREFIX):
        raise RuntimeError(
            "DATABASE_URL must point to PostgreSQL before running this script. "
            f"Current value: {database_url}"
        )

    return app, database_url


def ensure_postgres_is_reachable(database_url: str) -> None:
    engine = create_engine(database_url)
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    finally:
        engine.dispose()


def run_alembic_upgrade(database_url: str) -> None:
    alembic_config = AlembicConfig(os.fspath(ROOT_DIR / "alembic.ini"))
    alembic_config.set_main_option("sqlalchemy.url", database_url)
    alembic_config.set_main_option("script_location", os.fspath(ROOT_DIR / "migrations"))
    command.upgrade(alembic_config, "head")


def seed_reference_data() -> None:
    seed_categories()
    seed_districts()


def seed_mock_data() -> None:
    seed_all()


def resolve_sqlite_url(value: str) -> str:
    if "://" in value:
        if not value.startswith("sqlite:///"):
            raise RuntimeError("Only sqlite:/// URLs are supported for --import-sqlite.")
        return value

    sqlite_path = Path(value)
    if not sqlite_path.is_absolute():
        sqlite_path = (ROOT_DIR / sqlite_path).resolve()

    if not sqlite_path.exists():
        raise RuntimeError(f"SQLite file not found: {sqlite_path}")

    return f"sqlite:///{sqlite_path.as_posix()}"


def read_sqlite_rows(sqlite_url: str, table_name: str) -> list[dict[str, Any]]:
    sqlite_path = sqlite_url.removeprefix("sqlite:///")
    connection = sqlite3.connect(sqlite_path)
    connection.row_factory = sqlite3.Row
    try:
        table_names = {
            row["name"]
            for row in connection.execute(
                "SELECT name FROM sqlite_master WHERE type='table'"
            ).fetchall()
        }
        if table_name not in table_names:
            return []

        rows = connection.execute(f"SELECT * FROM {table_name}").fetchall()
        return [dict(row) for row in rows]
    finally:
        connection.close()


def normalize_import_value(value: Any, column_type: Any) -> Any:
    if value is None:
        return None

    if isinstance(column_type, JSON):
        if isinstance(value, str):
            return json.loads(value)
        return value

    if isinstance(column_type, DateTime):
        if isinstance(value, str):
            parsed = datetime.fromisoformat(value)
            if parsed.tzinfo is None:
                return parsed.replace(tzinfo=timezone.utc)
            return parsed
        return value

    return value


def ensure_target_is_empty() -> None:
    inspector = inspect(db.engine)
    missing_tables = set(REQUIRED_SCHEMA_TABLES) - set(inspector.get_table_names())
    if missing_tables:
        missing_display = ", ".join(sorted(missing_tables))
        raise RuntimeError(
            "PostgreSQL schema is incomplete even after migrations. Missing tables: "
            f"{missing_display}"
        )

    metadata = MetaData()
    metadata.reflect(bind=db.engine, only=list(TABLE_COPY_ORDER))

    for table_name in TABLE_COPY_ORDER:
        table = metadata.tables[table_name]
        row_count = db.session.execute(select(func.count()).select_from(table)).scalar_one()
        if row_count > 0:
            raise RuntimeError(
                "PostgreSQL already contains data. "
                "Import into an empty database to avoid duplicates."
            )


def import_sqlite_into_postgres(sqlite_url: str) -> None:
    ensure_target_is_empty()

    metadata = MetaData()
    metadata.reflect(bind=db.engine, only=list(TABLE_COPY_ORDER))

    inserted_counts: dict[str, int] = {}

    try:
        for table_name in TABLE_COPY_ORDER:
            source_rows = read_sqlite_rows(sqlite_url, table_name)
            if not source_rows:
                inserted_counts[table_name] = 0
                continue

            table = metadata.tables[table_name]
            normalized_rows = []
            for source_row in source_rows:
                normalized_row = {}
                for column in table.columns:
                    if column.name not in source_row:
                        continue
                    normalized_row[column.name] = normalize_import_value(
                        source_row[column.name], column.type
                    )

                if normalized_row:
                    normalized_rows.append(normalized_row)

            if normalized_rows:
                db.session.execute(table.insert(), normalized_rows)

            inserted_counts[table_name] = len(normalized_rows)

        db.session.commit()

        for table_name in TABLE_COPY_ORDER:
            if "id" not in metadata.tables[table_name].c:
                continue
            db.session.execute(
                text(
                    "SELECT setval("
                    f"pg_get_serial_sequence('{table_name}', 'id'), "
                    f"COALESCE((SELECT MAX(id) FROM {table_name}), 1), "
                    f"(SELECT COALESCE(MAX(id), 0) > 0 FROM {table_name})"
                    ")"
                )
            )
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise

    print("SQLite import complete:")
    for table_name in TABLE_COPY_ORDER:
        print(f"  {table_name}: {inserted_counts[table_name]} rows")


def main() -> None:
    args = parse_args()

    if args.seed_mock_data and args.import_sqlite:
        raise RuntimeError(
            "Use either --seed-mock-data or --import-sqlite, not both in the same run."
        )

    app, database_url = build_app()

    print(f"Using PostgreSQL database: {database_url}")
    ensure_postgres_is_reachable(database_url)
    print("PostgreSQL connection OK")

    print("Applying Alembic migrations...")
    run_alembic_upgrade(database_url)
    print("Alembic upgrade complete")

    with app.app_context():
        if args.import_sqlite:
            sqlite_url = resolve_sqlite_url(args.import_sqlite)
            print(f"Importing SQLite data from: {sqlite_url}")
            import_sqlite_into_postgres(sqlite_url)
        elif args.seed_mock_data:
            print("Seeding reference data and mock appeals...")
            seed_mock_data()
        else:
            print("Seeding reference data...")
            seed_reference_data()

    print("PostgreSQL bootstrap complete")


if __name__ == "__main__":
    main()
