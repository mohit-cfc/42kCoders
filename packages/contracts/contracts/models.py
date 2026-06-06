from pydantic import BaseModel, Field
from typing import List, Optional

# --- Merchant discovery ---

class Deal(BaseModel):
    id: str
    title: str
    description: str
    discount_percentage: float
    valid_until: str

class Merchant(BaseModel):
    id: str
    name: str
    category: str
    rating: float
    distance_meters: float
    address: str
    latitude: float
    longitude: float
    deals: List[Deal] = []

class MerchantSearchRequest(BaseModel):
    query: Optional[str] = None
    latitude: float
    longitude: float
    category: Optional[str] = None
    radius_meters: float = 2000.0

class MerchantSearchResponse(BaseModel):
    merchants: List[Merchant]
    total_found: int


# --- Travel (flights, trains, hotels) ---

class TravelOption(BaseModel):
    id: str
    type: str = Field(..., description="flight, train, or hotel")
    provider: str = Field(..., description="e.g. Indigo, Air India, IRCTC Shatabdi, Marriott")
    name: str = Field(..., description="Flight number, Train number, or Hotel name")
    departure_time: Optional[str] = Field(None, description="ISO datetime for flight/train departure")
    arrival_time: Optional[str] = Field(None, description="ISO datetime for flight/train arrival")
    origin: Optional[str] = Field(None, description="Origin city or code")
    destination: Optional[str] = Field(None, description="Destination city or code")
    price: float
    rating: Optional[float] = None
    details: str = Field(..., description="Additional info (layovers, seat type, room class, etc.)")

class TravelSearchRequest(BaseModel):
    type: str = Field(..., description="flight, train, or hotel")
    origin: Optional[str] = Field(None, description="Required for flights/trains")
    destination: str = Field(..., description="Destination city or hotel location")
    departure_date: str = Field(..., description="YYYY-MM-DD")
    return_date: Optional[str] = Field(None, description="YYYY-MM-DD")
    passengers: int = 1

class TravelSearchResponse(BaseModel):
    options: List[TravelOption]
    total_found: int


# --- Support and FAQs ---

class SupportItem(BaseModel):
    id: str
    question: str
    answer: str
    category: str
    tags: List[str] = []
    action_link: Optional[str] = Field(None, description="Direct in-app route to resolve the issue (e.g. paytm://wallet/kyc)")

class SupportSearchRequest(BaseModel):
    query: str
    category: Optional[str] = None

class SupportSearchResponse(BaseModel):
    items: List[SupportItem]
    answer_synthesis: Optional[str] = Field(None, description="Synthesized answer for quick scanning")
