"""Initial migration with all tables

Revision ID: 96c5ed7c51e9
Revises: 18365e7e2220
Create Date: 2025-12-18 12:36:45.713897

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '96c5ed7c51e9'
down_revision: Union[str, None] = '18365e7e2220'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
