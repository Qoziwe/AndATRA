"""add location_text to appeals

Revision ID: a0a6c3c9b1d4
Revises: 5cbfc778fb87
Create Date: 2026-04-03 14:10:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a0a6c3c9b1d4"
down_revision: Union[str, None] = "5cbfc778fb87"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("appeals", sa.Column("location_text", sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column("appeals", "location_text")
