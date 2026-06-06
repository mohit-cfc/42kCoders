"""init schema (postgis + tables + spatial index)

Revision ID: 0001
Revises:
"""
import sqlalchemy as sa
from alembic import op
from geoalchemy2 import Geography

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")

    op.create_table(
        "categories",
        sa.Column("id", sa.String(50), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("icon_url", sa.Text(), nullable=True),
    )

    op.create_table(
        "vendors",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("phone", sa.String(15), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "users",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("phone", sa.String(15), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "search_sessions",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("user_id", sa.UUID(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "messages",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column(
            "session_id",
            sa.UUID(),
            sa.ForeignKey("search_sessions.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("role", sa.String(20), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "shops",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column(
            "vendor_id",
            sa.UUID(),
            sa.ForeignKey("vendors.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("title", sa.String(100), nullable=False),
        sa.Column("description", sa.String(280), nullable=True),
        sa.Column("category_id", sa.String(50), sa.ForeignKey("categories.id"), nullable=False),
        sa.Column("upi_id", sa.String(100), nullable=False),
        sa.Column(
            "location",
            Geography(geometry_type="POINT", srid=4326, spatial_index=False),
            nullable=False,
        ),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.execute("CREATE INDEX idx_shops_location ON shops USING GIST (location)")
    op.create_index("idx_shops_category", "shops", ["category_id"])
    op.create_index("idx_shops_active", "shops", ["is_active"])

    op.bulk_insert(
        sa.table(
            "categories",
            sa.column("id", sa.String),
            sa.column("name", sa.String),
            sa.column("icon_url", sa.Text),
        ),
        [
            {"id": "food", "name": "Food", "icon_url": None},
            {"id": "repair", "name": "Repair", "icon_url": None},
            {"id": "utility", "name": "Utility", "icon_url": None},
            {"id": "beauty", "name": "Beauty", "icon_url": None},
            {"id": "other", "name": "Other", "icon_url": None},
        ],
    )


def downgrade():
    op.drop_table("shops")
    op.drop_table("messages")
    op.drop_table("search_sessions")
    op.drop_table("users")
    op.drop_table("vendors")
    op.drop_table("categories")
