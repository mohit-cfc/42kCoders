from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Category, Shop, Vendor
from app.db.session import get_session
from app.schemas import CategoryOut, VendorCreate, VendorProfile

router = APIRouter()


@router.get("/categories", response_model=list[CategoryOut])
async def list_categories(session: AsyncSession = Depends(get_session)):
    rows = (await session.execute(select(Category))).scalars().all()
    return [CategoryOut(id=c.id, name=c.name, icon_url=c.icon_url) for c in rows]


@router.post("/vendors", response_model=VendorProfile, status_code=201)
async def create_vendor(
    payload: VendorCreate, session: AsyncSession = Depends(get_session)
):
    vendor = Vendor(name=payload.title)
    session.add(vendor)
    await session.flush()

    shop = Shop(
        vendor_id=vendor.id,
        title=payload.title,
        description=payload.description,
        category_id=payload.category_id,
        upi_id=payload.upi_id,
        location=func.ST_SetSRID(func.ST_MakePoint(payload.lng, payload.lat), 4326),
    )
    session.add(shop)
    await session.commit()

    return VendorProfile(
        id=str(shop.id),
        title=shop.title,
        category=shop.category_id,
        description=shop.description,
        upi_id=shop.upi_id,
        lat=payload.lat,
        lng=payload.lng,
        is_active=True,
    )


@router.get("/vendors/{vendor_id}", response_model=VendorProfile)
async def get_vendor(vendor_id: str, session: AsyncSession = Depends(get_session)):
    sql = text(
        """
        SELECT s.id::text AS id, s.title, s.category_id AS category, s.description,
               s.upi_id, s.is_active,
               ST_Y(s.location::geometry) AS lat,
               ST_X(s.location::geometry) AS lng
        FROM shops s
        WHERE s.id = :id
        """
    )
    row = (await session.execute(sql, {"id": vendor_id})).mappings().first()
    if row is None:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return VendorProfile(**row)
