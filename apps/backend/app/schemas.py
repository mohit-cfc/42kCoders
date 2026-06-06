import re

from pydantic import BaseModel, field_validator

UPI_RE = re.compile(r"^[a-zA-Z0-9._-]+@[a-zA-Z]+$")


class TextSearchRequest(BaseModel):
    query: str
    lat: float
    lng: float
    radius_km: float = 2.0


class VendorOut(BaseModel):
    id: str
    title: str
    category: str
    description: str | None = None
    distance_m: int
    lat: float
    lng: float
    upi_id: str


class SearchResponse(BaseModel):
    vendors: list[VendorOut]
    interpreted_query: str
    total: int


class VendorCreate(BaseModel):
    title: str
    category_id: str
    description: str | None = None
    upi_id: str
    lat: float
    lng: float

    @field_validator("upi_id")
    @classmethod
    def validate_upi(cls, v: str) -> str:
        if not UPI_RE.match(v):
            raise ValueError("Invalid UPI ID format")
        return v


class VendorProfile(BaseModel):
    id: str
    title: str
    category: str
    description: str | None = None
    upi_id: str
    lat: float
    lng: float
    is_active: bool


class CategoryOut(BaseModel):
    id: str
    name: str
    icon_url: str | None = None
