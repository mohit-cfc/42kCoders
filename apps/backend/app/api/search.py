from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.agent.tools import search_vendors
from app.core.config import settings
from app.db.session import get_session
from app.schemas import SearchResponse, TextSearchRequest, VendorOut

router = APIRouter()


@router.post("/text", response_model=SearchResponse)
async def search_text(
    req: TextSearchRequest, session: AsyncSession = Depends(get_session)
):
    # TODO: replace this direct keyword search with the Sarvam agent loop
    # (app.agent.sarvam.run_agent) to extract category/keyword intent from the
    # raw query. For now the whole query is used as the keyword.
    rows = await search_vendors(
        session,
        lat=req.lat,
        lng=req.lng,
        radius_km=req.radius_km,
        keyword=req.query or None,
        limit=settings.MAX_RESULTS,
    )
    vendors = [VendorOut(**{**r, "distance_m": round(r["distance_m"])}) for r in rows]
    return SearchResponse(vendors=vendors, interpreted_query=req.query, total=len(vendors))
