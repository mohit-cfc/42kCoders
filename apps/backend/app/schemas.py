import re

from pydantic import BaseModel, Field, field_validator

UPI_RE = re.compile(r"^[a-zA-Z0-9._-]+@[a-zA-Z]+$")


class TextSearchRequest(BaseModel):
    query: str
    lat: float
    lng: float
    # Hyperlocal: bounded to (0, 10] km. Frontend may expose this as a slider.
    radius_km: float = Field(default=2.0, gt=0, le=10)


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


class VoiceSearchResponse(SearchResponse):
    # The STT transcript, so the client can show the user what was heard.
    transcript: str


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
