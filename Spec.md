# Dhundho — Product Documentation
> Hyperlocal Street Vendor Discovery via Paytm Merchant Network
> Version 1.0 | Hackathon MVP

---

# BRD — Business Requirements Document

## 1. Business Context

India has 60M+ unorganized retail vendors (pani puri vala, cobbler, gola kalla, etc.) who are invisible to every digital discovery platform. Google Maps ignores them. Zomato doesn't want them. Yet millions of these vendors are already on **Paytm for Business** — they have QR codes, UPI IDs, and a digital identity.

Dhundho monetizes Paytm's existing merchant network by turning it into a hyperlocal discovery layer — without requiring vendors to learn a new platform.

## 2. Problem Statement

| Persona | Problem |
|---------|---------|
| Customer | Cannot find a nearby pani puri vala, chappal repair, or gola kalla via any app |
| Street vendor | Has no digital presence beyond a Paytm QR code; loses customers who don't know they exist |
| Paytm | Has 10M+ business merchants but no consumer-facing discovery surface to drive transaction volume |

## 3. Business Goals

1. Increase Paytm merchant network engagement by surfacing vendors to nearby customers
2. Drive incremental Paytm payment transactions via vendor discovery
3. Demonstrate a viral growth loop: every vendor profile is a Paytm payment touchpoint

## 4. Stakeholders

| Stakeholder | Interest |
|------------|---------|
| Paytm (primary) | Merchant retention, transaction volume, new merchant onboarding |
| Street vendors | More foot traffic, digital visibility |
| End customers | Find local services/food quickly |

## 5. Success Metrics (Post-Hackathon)

| Metric | Target |
|--------|--------|
| Vendor onboarding time | < 2 minutes |
| Search-to-discovery time | < 10 seconds |
| Payment conversion post-discovery | > 30% |
| Vendor retention (monthly active) | > 60% |

## 6. Constraints

- 8–12 hour hackathon build window
- 2–3 developers (1 frontend, 1 backend/AI/devops)
- Sarvam AI: 10M token budget
- Paytm integration: UPI deep link only (no Payment Links API, no full SDK for hackathon)

---

# PRD — Product Requirements Document

## 1. Vision

> "Any street vendor in India goes online in 2 minutes. Any customer finds them in 10 seconds."

## 2. Target Users

**Primary:** End customers (urban, 18–35, UPI-native, uses Paytm)
**Secondary:** Street vendors (semi-literate, Hinglish-comfortable, Paytm for Business user)

## 3. User Stories

### Customer
| # | Story | Priority |
|---|-------|----------|
| C1 | As a customer, I want to type or speak "pani puri" in Hindi and see vendors near me | P0 |
| C2 | As a customer, I want to see vendor pins on a map with distance | P0 |
| C3 | As a customer, I want to see vendor name, category, description, and rating | P1 |
| C4 | As a customer, I want to tap "Pay Now" and be taken to Paytm checkout | P1 |
| C5 | As a customer, I want search results in Hinglish/Hindi | P1 |

### Vendor
| # | Story | Priority |
|---|-------|----------|
| V1 | As a vendor, I want to register my shop with name, category, description, and location | P0 |
| V2 | As a vendor, I want my location captured automatically via GPS | P0 |
| V3 | As a vendor, I want to add my UPI ID so customers can pay me | P1 |
| V4 | As a vendor, I want to mark myself active/inactive for the day | P2 |

## 4. Feature Scope

### In Scope (MVP)
- Voice + text search (Hinglish/Hindi via Sarvam STT + LLM)
- AI agent with tool calling → PostGIS geospatial vendor query
- Map pin view of results (react-native-maps)
- Vendor profile screen (name, category, description, distance)
- Paytm UPI deep link on vendor profile
- Vendor self-registration form (name, category, description, GPS location, UPI ID)
- Seeded mock vendor data for demo

### Out of Scope (V2)
- Vendor ratings/reviews
- Real-time vendor availability
- Order management / delivery
- Vendor analytics dashboard
- Full Paytm SDK integration
- Authentication / user accounts

## 5. User Flows

### Customer Search Flow
```
Open App
  → Home Screen (search bar + mic button)
    → Type / speak query ("bhai pani puri chahiye")
      → Sarvam STT (if voice) → text
        → AI agent extracts intent + category
          → PostGIS radius query (default: 2km)
            → Map Screen with vendor pins
              → Tap pin → Vendor Profile Sheet
                → "Pay Now" → Paytm deep link
```

### Vendor Onboarding Flow
```
Open App
  → "Register My Shop" CTA
    → Onboard Screen
      → Fill: Shop Name, Category (dropdown), Description (280 chars), UPI ID
        → GPS auto-captured
          → Submit → Vendor live on map
```

---

# FRD — Functional Requirements Document

## 1. Screens & Components

### 1.1 Home Screen
| Element | Behaviour |
|---------|-----------|
| Search bar | Text input, auto-focus on load |
| Mic button | Starts on-device audio recording; on stop, sends audio blob to `POST /api/search/voice` |
| "Register my shop" link | Navigates to OnboardScreen |
| Submit (text) | Calls `POST /api/search/text` with query + lat/lng |

### 1.2 Map Screen
| Element | Behaviour |
|---------|-----------|
| Map (react-native-maps) | Centers on user location, shows vendor pins |
| Vendor pin | Custom marker with category icon |
| Tap pin | Opens bottom sheet with vendor details |
| Bottom sheet | Name, category, description, distance, "Pay Now" button |
| "Pay Now" | Fires `paytm://pay?pa={upi_id}&pn={vendor_name}` deep link |

### 1.3 Onboard Screen
| Field | Validation |
|-------|-----------|
| Shop Name | Required, max 100 chars |
| Category | Required, dropdown from `/api/categories` |
| Description | Optional, max 280 chars |
| UPI ID | Required, regex: `[a-zA-Z0-9._-]+@[a-zA-Z]+` |
| Location | Auto via GPS, not editable, show address preview |

## 2. API Endpoints

### Backend (FastAPI)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/search/text` | Text search — body: `{query, lat, lng, radius_km}` |
| POST | `/api/search/voice` | Voice search — multipart: `audio_file, lat, lng, radius_km` |
| POST | `/api/vendors` | Register new vendor |
| GET | `/api/vendors/{id}` | Get vendor profile |
| GET | `/api/categories` | List all categories |
| GET | `/api/health` | Health check |

### Request/Response: `POST /api/search/text`

**Request:**
```json
{
  "query": "bhai pani puri chahiye",
  "lat": 18.5204,
  "lng": 73.8567,
  "radius_km": 2
}
```

### Request/Response: `POST /api/search/voice`

**Request:** `multipart/form-data`
```
audio_file: <.wav or .mp3 blob>
lat: 18.5204
lng: 73.8567
radius_km: 2
```

Backend flow: Sarvam STT transcribes audio → transcribed text passed to AI agent → same response as text search.

Supported audio formats: WAV (preferred), MP3. Max size: 10MB.

### Shared Search Response
```json
{
  "vendors": [
    {
      "id": "uuid",
      "title": "Raju Pani Puri",
      "category": "food",
      "description": "Best pani puri in the area, since 1995",
      "distance_m": 320,
      "lat": 18.521,
      "lng": 73.857,
      "upi_id": "raju123@paytm"
    }
  ],
  "interpreted_query": "pani puri",
  "total": 3
}
```

### Request/Response: `POST /api/vendors`

**Request:**
```json
{
  "title": "Raju Pani Puri",
  "category_id": "food",
  "description": "Best pani puri since 1995",
  "upi_id": "raju123@paytm",
  "lat": 18.521,
  "lng": 73.857
}
```

## 3. AI Agent — Tool Calling Spec

### Agent System Prompt
```
You are Dhundho, a hyperlocal vendor search assistant for Indian street vendors.
Extract the vendor category and search intent from the user's query (which may be in Hindi, Marathi, or Hinglish).
Use the search_vendors tool to find nearby vendors.
Respond in a friendly, concise tone in the same language as the user's query.
```

### Tool: `search_vendors`
```json
{
  "name": "search_vendors",
  "description": "Search for vendors near a location by category and keyword",
  "parameters": {
    "category": "string (food | repair | utility | beauty | other)",
    "keyword": "string (e.g. pani puri, chappal, polish)",
    "lat": "float",
    "lng": "float",
    "radius_km": "float (default: 2)"
  }
}
```

### Tool Implementation (PostGIS query)
```sql
SELECT id, name, category, description, upi_id,
       ST_Distance(location::geography, ST_MakePoint(:lng, :lat)::geography) AS distance_m
FROM shops
WHERE category = :category
  AND (description ILIKE '%' || :keyword || '%' OR name ILIKE '%' || :keyword || '%')
  AND ST_DWithin(location::geography, ST_MakePoint(:lng, :lat)::geography, :radius_m)
  AND is_active = true
ORDER BY distance_m ASC
LIMIT 5;
```

## 4. Paytm Deep Link Spec

```
paytm://pay?pa={upi_id}&pn={vendor_name}&cu=INR
```

Fallback (if Paytm not installed):
```
https://paytm.me/{upi_id}
```

---

# SRS — Software Requirements Specification

## 1. System Architecture

```
[React Native App]
     |
     | HTTPS
     v
[FastAPI Backend] — Railway (Docker)
     |         \
     |          [Sarvam AI API]
     v
[PostgreSQL + PostGIS] — Railway
```

## 2. Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Mobile | React Native (Bare) | No Expo |
| Navigation | React Navigation v6 | Stack navigator |
| Maps | react-native-maps | Google Maps SDK |
| Location | @react-native-community/geolocation | Native permissions |
| Audio Recording | react-native-audio-recorder-player | Voice input, native linking required |
| Backend | FastAPI + Uvicorn | Python 3.11 |
| ORM | SQLAlchemy 2.0 | Async |
| Migrations | Alembic | |
| DB | PostgreSQL 15 + PostGIS 3.3 | Railway |
| AI | Sarvam AI (STT + LLM) | Tool calling |
| Fallback LLM | Gemini Flash | If Sarvam quota exceeded |
| Containerization | Docker + docker-compose | Local dev |
| Deployment | Railway | Backend + DB |
| API Client | Axios | Mobile |

## 3. Database Schema

```sql
-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Categories
CREATE TABLE categories (
  id VARCHAR(50) PRIMARY KEY,  -- 'food', 'repair', 'utility', 'beauty', 'other'
  name VARCHAR(100) NOT NULL,
  icon_url TEXT
);

-- Vendors (supply side)
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(15),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shops
CREATE TABLE shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  description VARCHAR(280),
  category_id VARCHAR(50) REFERENCES categories(id),
  upi_id VARCHAR(100) NOT NULL,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Spatial index for fast radius queries
CREATE INDEX idx_shops_location ON shops USING GIST(location);
CREATE INDEX idx_shops_category ON shops(category_id);
CREATE INDEX idx_shops_active ON shops(is_active);

-- Users (demand side — future)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(15),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Search sessions
CREATE TABLE search_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages (conversation history)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES search_sessions(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL,  -- 'user' | 'assistant'
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 4. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Search response time | < 2 seconds end-to-end |
| API uptime (demo) | 99% during hackathon window |
| Radius search accuracy | PostGIS GEOGRAPHY type (meter-accurate) |
| Max vendors returned | 5 per search |
| Mobile min SDK | Android 8.0 (API 26) |
| Token budget per search | < 1000 Sarvam tokens |

## 5. Environment Variables

```env
# Backend
DATABASE_URL=postgresql+asyncpg://user:pass@host/dhundho
SARVAM_API_KEY=
GEMINI_API_KEY=
ALLOWED_ORIGINS=*

# Mobile
API_BASE_URL=https://dhundho-backend.railway.app
GOOGLE_MAPS_API_KEY=
```

## 6. Docker Setup

```dockerfile
# Dockerfile (backend)
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```yaml
# docker-compose.yml (local dev)
version: "3.9"
services:
  db:
    image: postgis/postgis:15-3.3
    environment:
      POSTGRES_DB: dhundho
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
  backend:
    build: ./apps/backend
    ports:
      - "8000:8000"
    env_file: .env
    depends_on:
      - db
```

## 7. Seed Data (Mock Vendors for Demo)

Seed 10–15 vendors within 2km of demo location before the hackathon presentation. Categories to seed: food (pani puri, vada pav, gola kalla, chai), repair (chappal, cycle, mobile), utility (photocopy, STD booth).

## 8. Risk Register

| Risk | Mitigation |
|------|-----------|
| Sarvam token exhaustion | Gemini Flash fallback |
| Paytm app not installed on judge's phone | Fallback to `paytm.me` web link |
| Google Maps API key delay | Use OpenStreetMap (react-native-maps supports it) |
| PostGIS not available on Railway | Use Railway's PostgreSQL + run `CREATE EXTENSION postgis` on first migration |
| React Native build failure | Keep a web fallback (React + Leaflet) ready |

---

*Dhundho v1.0 — Hackathon MVP*