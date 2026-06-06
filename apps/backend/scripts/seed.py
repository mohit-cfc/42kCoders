"""Seed demo vendors near the demo location.

Idempotent: wipes existing shops + vendors before inserting, so re-running gives a clean,
duplicate-free demo dataset. Categories are owned by migration 0001 and left untouched.

Vendors are scattered around the demo center on a golden-angle spiral (deterministic, no
overlap) within ~1.3km, so they all fall inside the default 2km search radius.

Demo center defaults to Waterstones Hotel, Marol, Mumbai (near T2). Override with
DEMO_LAT / DEMO_LNG env vars.

Run from apps/backend:  uv run python scripts/seed.py
"""

from __future__ import annotations

import asyncio
import math
import os
import sys

# Allow `import app...` regardless of the current working directory.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import delete, func  # noqa: E402

from app.db.models import Shop, Vendor  # noqa: E402
from app.db.session import AsyncSessionLocal, engine  # noqa: E402

DEMO_LAT = float(os.getenv("DEMO_LAT", "19.10598"))
DEMO_LNG = float(os.getenv("DEMO_LNG", "72.86016"))

# (title, category_id, description, upi_id)
VENDORS: list[tuple[str, str, str, str]] = [
    # --- food ---
    ("Raju Pani Puri & Chaat", "food", "Spicy pani puri, sev puri, dahi puri. Since 1998.", "rajupanipuri@paytm"),
    ("Mumbai Vada Pav Center", "food", "Garam garam vada pav, misal pav & samosa.", "vadapav@ybl"),
    ("Anna Idli Dosa Corner", "food", "South Indian idli, medu vada, dosa, uttapam.", "annadosa@okaxis"),
    ("Sandwichwala Express", "food", "Veg, cheese & grilled sandwiches.", "sandwichwala@paytm"),
    ("Shree Ganne Ka Ras", "food", "Fresh sugarcane juice with lemon & ginger.", "gannejuice@ybl"),
    ("Fresh Fruit Juice Center", "food", "Mosambi, orange & watermelon juice.", "fruitjuice@okhdfcbank"),
    ("Bhaji Wala Sabzi Stall", "food", "Fresh daily vegetables at roadside rates.", "sabziwala@paytm"),
    ("Anil Fruit Stall", "food", "Seasonal fruits — apple, banana, papaya, chikoo.", "fruitstall@ybl"),
    ("Nariyal Pani Wala", "food", "Tender coconut water, fresh every morning.", "nariyalpani@okaxis"),
    ("Tapri Chai Stall", "food", "Cutting chai, coffee & glucose biscuit.", "taprichai@paytm"),
    # --- repair ---
    ("Ramesh Mochi", "repair", "Shoe & chappal repair, polish, sole stitching.", "rameshmochi@paytm"),
    ("Speed Cycle Repair", "repair", "Puncture, brake, chain & gear repair.", "cyclerepair@ybl"),
    ("Mobile Care Repair", "repair", "Screen, battery & charging port repair.", "mobilecare@okaxis"),
    ("Time Zone Watch Repair", "repair", "Watch battery, strap & glass replacement.", "watchrepair@paytm"),
    ("Chhatri Repair Wala", "repair", "Umbrella & bag zip repair.", "chhatrirepair@ybl"),
    # --- beauty ---
    ("Sai Men's Salon", "beauty", "Haircut, shave & head massage.", "saisalon@paytm"),
    ("Glamour Beauty Parlour", "beauty", "Threading, facial, waxing & cleanup.", "glamourparlour@ybl"),
    ("New Look Barber Shop", "beauty", "Trendy haircuts & beard styling.", "newlookbarber@okaxis"),
    ("Mehendi by Asha", "beauty", "Bridal & festive mehendi designs.", "mehendiasha@paytm"),
    ("Sharp Hair Studio", "beauty", "Unisex hair styling & spa.", "sharphair@ybl"),
    # --- utility ---
    ("Sai Xerox & Photocopy", "utility", "Xerox, printout, lamination & binding.", "saixerox@paytm"),
    ("Quick Mobile Recharge", "utility", "All-operator recharge & bill payment.", "quickrecharge@ybl"),
    ("Chabi Wala Key Maker", "utility", "Duplicate keys & lock repair.", "chabiwala@okaxis"),
    ("Sharma Tailor", "utility", "Stitching & alterations, quick delivery.", "sharmatailor@paytm"),
    ("Istri Wala Ironing", "utility", "Clothes ironing & press with pickup.", "istriwala@ybl"),
    # --- other ---
    ("Phoolwala Bouquet Corner", "other", "Fresh flower bouquets & gift wrapping.", "phoolwala@paytm"),
    ("Gajra & Mala Stall", "other", "Mogra gajra & garlands for pooja.", "gajramala@ybl"),
    ("Balloon & Toy Vendor", "other", "Balloons, kids toys & return gifts.", "balloontoy@okaxis"),
    ("Agarbatti & Pooja Stall", "other", "Incense, diya & pooja samagri.", "poojastall@paytm"),
]

# Spiral spread radius in degrees (~1.3km at this latitude) — keeps all pins inside 2km.
SPREAD_DEG = 0.012
_GOLDEN_ANGLE = math.pi * (3 - math.sqrt(5))


def _offset(i: int, n: int) -> tuple[float, float]:
    """Deterministic golden-angle spiral point → (dlat, dlng) in degrees."""
    r = SPREAD_DEG * math.sqrt((i + 1) / n)
    theta = i * _GOLDEN_ANGLE
    return r * math.cos(theta), r * math.sin(theta)


async def seed() -> None:
    n = len(VENDORS)
    async with AsyncSessionLocal() as session:
        # Idempotent reset (shops first, then vendors — FK also cascades).
        await session.execute(delete(Shop))
        await session.execute(delete(Vendor))

        for i, (title, category_id, description, upi_id) in enumerate(VENDORS):
            dlat, dlng = _offset(i, n)
            lat, lng = DEMO_LAT + dlat, DEMO_LNG + dlng

            vendor = Vendor(name=title)
            session.add(vendor)
            await session.flush()  # populate vendor.id

            session.add(
                Shop(
                    vendor_id=vendor.id,
                    title=title,
                    description=description,
                    category_id=category_id,
                    upi_id=upi_id,
                    location=func.ST_SetSRID(func.ST_MakePoint(lng, lat), 4326),
                )
            )

        await session.commit()

    await engine.dispose()
    print(f"Seeded {n} vendors around ({DEMO_LAT}, {DEMO_LNG}).")


if __name__ == "__main__":
    asyncio.run(seed())
