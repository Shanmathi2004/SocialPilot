from alembic import op
import sqlalchemy as sa


revision = "c1597fd1d650"
down_revision = "815983ba4942"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "campaigns",
        sa.Column(
            "budget",
            sa.Float(),
            nullable=False,
            server_default="0",
        ),
    )

    op.add_column(
        "campaigns",
        sa.Column(
            "revenue",
            sa.Float(),
            nullable=False,
            server_default="0",
        ),
    )


def downgrade() -> None:
    op.drop_column(
        "campaigns",
        "revenue",
    )

    op.drop_column(
        "campaigns",
        "budget",
    )