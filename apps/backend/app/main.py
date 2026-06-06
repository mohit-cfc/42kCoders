from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import health, search, vendors
from app.core.config import settings

app = FastAPI(title="Dhundho API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.ALLOWED_ORIGINS.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(vendors.router, prefix="/api")
app.include_router(search.router, prefix="/api/search")
