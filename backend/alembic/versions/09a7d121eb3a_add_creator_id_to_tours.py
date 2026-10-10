"""add creator_id to tours

Revision ID: 09a7d121eb3a
Revises: 96c5ed7c51e9
Create Date: 2026-01-18 11:51:04.079850

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '09a7d121eb3a'
down_revision: Union[str, None] = '96c5ed7c51e9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
