"""In-process tools the search layer (and, later, the Sarvam agent) call directly.

`search_vendors` is the core PostGIS query. It is a plain function — NOT an MCP
server — per CLAUDE.md ("tool calling inside FastAPI").
"""

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

# Parameterized to avoid injection (note the safe '%' || :keyword || '%').
# Explicit ::text casts on the nullable params: asyncpg can't infer a type for a bare
# `:param IS NULL` and raises AmbiguousParameterError without them.
SEARCH_SQL = text(
    """
    SELECT s.id::text AS id,
           s.title,
           s.category_id AS category,
           s.description,
           s.upi_id,
           ST_Y(s.location::geometry) AS lat,
           ST_X(s.location::geometry) AS lng,
           ST_Distance(s.location, ST_MakePoint(:lng, :lat)::geography) AS distance_m
    FROM shops s
    WHERE ST_DWithin(s.location, ST_MakePoint(:lng, :lat)::geography, :radius_m)
      AND (CAST(:category AS text) IS NULL OR s.category_id = CAST(:category AS text))
      AND (CAST(:keyword AS text) IS NULL
           OR s.title ILIKE '%' || CAST(:keyword AS text) || '%'
           OR s.description ILIKE '%' || CAST(:keyword AS text) || '%')
      AND s.is_active = true
    ORDER BY distance_m ASC
    LIMIT :limit
    """
)


async def search_vendors(
    session: AsyncSession,
    *,
    lat: float,
    lng: float,
    radius_km: float = 2.0,
    category: str | None = None,
    keyword: str | None = None,
    limit: int = 5,
) -> list[dict]:
    rows = (
        await session.execute(
            SEARCH_SQL,
            {
                "lat": lat,
                "lng": lng,
                "radius_m": radius_km * 1000,
                "category": category,
                "keyword": keyword,
                "limit": limit,
            },
        )
    ).mappings().all()
    return [dict(r) for r in rows]
