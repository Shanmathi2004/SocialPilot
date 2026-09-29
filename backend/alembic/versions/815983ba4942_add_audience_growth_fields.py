from alembic import op
import sqlalchemy as sa


revision = "815983ba4942"
down_revision = "dedafbdd7b44"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "social_accounts",
        sa.Column(
            "followers_count",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
    )

    op.add_column(
        "social_accounts",
        sa.Column(
            "previous_followers_count",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
    )

    op.add_column(
        "social_accounts",
        sa.Column(
            "followers_updated_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column(
        "social_accounts",
        "followers_updated_at",
    )

    op.drop_column(
        "social_accounts",
        "previous_followers_count",
    )

    op.drop_column(
        "social_accounts",
        "followers_count",
    )