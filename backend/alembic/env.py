import subprocess
import os
from alembic import op
import sqlalchemy as sa

def test_alembic_upgrade_runs():
    # Run alembic upgrade to head
    result = subprocess.run(
        ["alembic", "upgrade", "head"],
        cwd=os.path.abspath(os.path.join(os.path.dirname(__file__), "..")),
        capture_output=True,
        text=True
    )
    print(result.stdout)
    assert result.returncode == 0, f"Alembic upgrade failed:\n{result.stderr}"



# If using Alembic, create a migration
"""
Add OAuth fields to users table

Revision ID: add_oauth_fields
Revises: previous_revision
Create Date: 2024-01-01 00:00:00.000000

"""


def upgrade():
    op.add_column('users', sa.Column('google_id', sa.String(), nullable=True))
    op.add_column('users', sa.Column('apple_id', sa.String(), nullable=True))
    op.add_column('users', sa.Column('email_verified', sa.Boolean(), default=False))
    op.add_column('users', sa.Column('auth_method', sa.String(), default='email'))
    
    # Create indexes
    op.create_index(op.f('ix_users_google_id'), 'users', ['google_id'], unique=True)
    op.create_index(op.f('ix_users_apple_id'), 'users', ['apple_id'], unique=True)

def downgrade():
    op.drop_index(op.f('ix_users_apple_id'), table_name='users')
    op.drop_index(op.f('ix_users_google_id'), table_name='users')
    op.drop_column('users', 'auth_method')
    op.drop_column('users', 'email_verified')
    op.drop_column('users', 'apple_id')
    op.drop_column('users', 'google_id')    
