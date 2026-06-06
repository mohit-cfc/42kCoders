import logging

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.agent import sarvam
from app.agent.tools import search_vendors
from app.core.config import settings
from app.db.session import get_session
from app.schemas import (
    SearchResponse,
    TextSearchRequest,
    VendorOut,
    VoiceSearchResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter()

MAX_AUDIO_BYTES = 10 * 1024 * 1024  # 10MB per Spec FRD §2
# RN blobs sometimes arrive as octet-stream, so we accept that alongside audio/*.
ALLOWED_AUDIO_TYPES = {
    "audio/wav", "audio/x-wav", "audio/wave", "audio/mpeg", "audio/mp3",
    "audio/mp4", "audio/m4a", "audio/x-m4a", "audio/aac", "audio/ogg",
    "audio/opus", "audio/flac", "audio/webm", "application/octet-stream",
}


async def _run_search(
    session: AsyncSession, *, query: str, lat: float, lng: float, radius_km: float
) -> tuple[list[VendorOut], str]:
    """Shared text→intent→PostGIS path used by both text and voice search.

    Single-shot Sarvam intent extraction → {category, keyword}. Two distinct paths:
      - AI succeeds, off-topic (both category and keyword null) → deliberately return empty.
      - AI fails (no key, timeout, quota, parse error) → fall back to raw-keyword search so
        search never hard-fails.
    Returns (vendors, interpreted_query).
    """
    try:
        intent = await sarvam.extract_intent(query)
        category = intent["category"]
        keyword = intent["keyword"]
        # Off-topic query: the model found neither a category nor an item to search for.
        # Return empty on purpose rather than letting search_vendors match everything in radius.
        if category is None and keyword is None:
            return [], query
        interpreted = keyword or query
    except Exception:  # noqa: BLE001 — AI failure falls back to keyword search
        logger.warning("intent extraction failed; falling back to keyword search", exc_info=True)
        category = None
        keyword = query or None
        interpreted = query

    rows = await search_vendors(
        session,
        lat=lat,
        lng=lng,
        radius_km=radius_km,
        category=category,
        keyword=keyword,
        limit=settings.MAX_RESULTS,
    )
    vendors = [VendorOut(**{**r, "distance_m": round(r["distance_m"])}) for r in rows]
    return vendors, interpreted


@router.post("/text", response_model=SearchResponse)
async def search_text(
    req: TextSearchRequest, session: AsyncSession = Depends(get_session)
):
    vendors, interpreted = await _run_search(
        session, query=req.query, lat=req.lat, lng=req.lng, radius_km=req.radius_km
    )
    return SearchResponse(vendors=vendors, interpreted_query=interpreted, total=len(vendors))


@router.post("/voice", response_model=VoiceSearchResponse)
async def search_voice(
    audio_file: UploadFile = File(...),
    lat: float = Form(...),
    lng: float = Form(...),
    radius_km: float = Form(settings.DEFAULT_RADIUS_KM, gt=0, le=10),
    session: AsyncSession = Depends(get_session),
):
    # Validate the upload before spending an STT call.
    if audio_file.content_type not in ALLOWED_AUDIO_TYPES:
        raise HTTPException(
            status_code=400, detail=f"Unsupported audio type: {audio_file.content_type}"
        )
    audio_bytes = await audio_file.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Empty audio file")
    if len(audio_bytes) > MAX_AUDIO_BYTES:
        raise HTTPException(status_code=400, detail="Audio file exceeds 10MB limit")

    # STT failure is isolated here — there's no text to fall back on, so surface a clean 502.
    try:
        transcript = await sarvam.transcribe(audio_bytes, audio_file.filename or "audio.wav")
    except Exception:  # noqa: BLE001
        logger.warning("Sarvam STT failed", exc_info=True)
        raise HTTPException(status_code=502, detail="Speech-to-text failed, please try again")

    vendors, interpreted = await _run_search(
        session, query=transcript, lat=lat, lng=lng, radius_km=radius_km
    )
    return VoiceSearchResponse(
        vendors=vendors, interpreted_query=interpreted, total=len(vendors), transcript=transcript
    )
