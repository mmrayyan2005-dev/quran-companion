"""Add hadith_books table and book_id on hadiths

Revision ID: a3f9c1d84e21
Revises: 28bb0f6bc3da
Create Date: 2026-09-05 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "a3f9c1d84e21"
down_revision: Union[str, None] = "28bb0f6bc3da"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "hadith_books",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("collection_id", sa.Integer(), nullable=False),
        sa.Column("book_number", sa.Integer(), nullable=False),
        sa.Column("book_name", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(["collection_id"], ["hadith_collections.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("collection_id", "book_number", name="uq_collection_book_number"),
    )
    op.add_column("hadiths", sa.Column("book_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_hadiths_book_id_hadith_books",
        "hadiths", "hadith_books",
        ["book_id"], ["id"],
    )


def downgrade() -> None:
    op.drop_constraint("fk_hadiths_book_id_hadith_books", "hadiths", type_="foreignkey")
    op.drop_column("hadiths", "book_id")
    op.drop_table("hadith_books")
