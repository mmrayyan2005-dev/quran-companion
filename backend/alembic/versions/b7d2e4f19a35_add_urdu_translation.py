"""Add Urdu translation text to verses

Revision ID: b7d2e4f19a35
Revises: a3f9c1d84e21
Create Date: 2026-11-12 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "b7d2e4f19a35"
down_revision: Union[str, None] = "a3f9c1d84e21"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("verses", sa.Column("text_translation_ur", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("verses", "text_translation_ur")
