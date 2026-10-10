"""add creator_id to tours

Revision ID: 918bd1781bce
Revises: 09a7d121eb3a
Create Date: 2026-01-18 11:56:24.231639

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '918bd1781bce'
down_revision: Union[str, None] = '09a7d121eb3a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
