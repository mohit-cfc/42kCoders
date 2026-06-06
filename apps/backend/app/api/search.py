import logging

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.agent import sarvam
from app.agent.tools import search_vendors
from app.core.config import settings
from app.db.session import get_session
from app.schemas import SearchResponse, TextSearchRequest, VendorOut

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/text", response_model=SearchResponse)
async def search_text(
    req: TextSearchRequest, session: AsyncSession = Depends(get_session)
):
    # Single-shot Sarvam intent extraction → {category, keyword}. If Sarvam is unavailable
    # (no key, timeout, quota, parse failure), degrade gracefully to raw-keyword search so
    # text search never hard-fails. interpreted_query reflects whatever we actually searched.
    category: str | None = None
    keyword = req.query or None
    interpreted = req.query
    try:
        intent = await sarvam.extract_intent(req.query)
        category = intent["category"]
        keyword = intent["keyword"] or keyword
        interpreted = intent["keyword"] or req.query
    except Exception:  # noqa: BLE001 — any AI failure falls back to keyword search
        logger.warning("intent extraction failed; falling back to keyword search", exc_info=True)

    rows = await search_vendors(
        session,
        lat=req.lat,
        lng=req.lng,
        radius_km=req.radius_km,
        category=category,
        keyword=keyword,
        limit=settings.MAX_RESULTS,
    )
    vendors = [VendorOut(**{**r, "distance_m": round(r["distance_m"])}) for r in rows]
    return SearchResponse(vendors=vendors, interpreted_query=interpreted, total=len(vendors))
