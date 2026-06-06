# Dhundho — CLAUDE.md
> Hyperlocal street vendor discovery on top of Paytm's merchant network.
> Read this before touching any code.

---

## What This App Does
Customer speaks/types "bhai pani puri chahiye" → Sarvam AI agent extracts intent → PostGIS radius query → vendor pins on map → tap vendor → Paytm UPI deep link to pay.

Vendor side: fill a form (name, category, description, UPI ID) → GPS captured → live on map.

---

## Monorepo Structure
```
dhundho/
├── apps/
│   ├── mobile/        # Bare React Native (no Expo)
│   └── backend/       # FastAPI + Uvicorn
├── packages/
│   └── design-system/ # Paytm-based design system
├── docs/
│   └── dhundho-spec.md  # BRD, PRD, FRD, SRS
├── docker-compose.yml
├── .env.example
└── CLAUDE.md
```

### Mobile (`apps/mobile/`)
```
src/
├── screens/
│   ├── HomeScreen.tsx      # Search + voice input
│   ├── MapScreen.tsx       # Vendor pins (react-native-maps)
│   └── OnboardScreen.tsx   # Vendor registration
├── components/
├── navigation/index.tsx    # React Navigation stack
├── services/api.ts         # Axios calls to backend
└── hooks/
    ├── useLocation.ts      # Device geolocation
    └── useAudioRecorder.ts # Audio recording + send to /api/search/voice
```

### Backend (`apps/backend/`)
```
app/
├── main.py
├── api/
│   ├── vendors.py      # POST /api/vendors, GET /api/vendors/{id}, GET /api/categories
│   └── search.py       # POST /api/search/text + POST /api/search/voice
├── agent/
│   ├── sarvam.py       # Sarvam STT + LLM wrapper
│   └── tools.py        # Tool calling — PostGIS search_vendors tool
├── db/
│   ├── models.py       # SQLAlchemy models
│   └── session.py      # Async DB session
└── core/
    └── config.py       # Pydantic settings from env
alembic/                 # DB migrations
scripts/
└── seed.py             # Seeds mock vendors near demo location
requirements.txt
Dockerfile
```

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Mobile | Bare React Native, React Navigation v6 |
| Maps | react-native-maps (Google Maps SDK) |
| Audio | react-native-audio-recorder-player (native linking required) |
| Backend | FastAPI, Uvicorn, SQLAlchemy 2.0 (async), Alembic |
| Database | PostgreSQL 15 + PostGIS 3.3 |
| AI | Sarvam AI (STT + LLM with tool calling) |
| Fallback LLM | Gemini Flash (if Sarvam quota exceeded) |
| Deployment | Railway (backend + DB via Docker) |

---

## Running Locally

```bash
# DB + backend
docker-compose up

# Mobile (separate terminal)
cd apps/mobile
npm install
npx react-native run-android
```

First-time DB setup:
```bash
cd apps/backend
alembic upgrade head
python scripts/seed.py   # seeds mock vendors near demo location
```

---

## Environment Variables

```env
# apps/backend/.env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/dhundho
SARVAM_API_KEY=
GEMINI_API_KEY=
ALLOWED_ORIGINS=*

# apps/mobile/.env
API_BASE_URL=http://localhost:8000
GOOGLE_MAPS_API_KEY=
```

---

## Key Architecture Decisions

**Sarvam lives on the backend only — never the frontend.**
Mobile records audio and sends it to `/api/search/voice` as a multipart blob. Backend calls Sarvam STT to transcribe, then passes text to Sarvam LLM for intent extraction. Zero AI calls from the mobile app. API keys never leave the backend.

**Why two search endpoints?**
`/api/search/text` (JSON) and `/api/search/voice` (multipart) are kept separate for clean error handling — STT failure doesn't affect text search. Both share the same agent + PostGIS logic internally.

**Why PostGIS?**
Vendor search is radius-based (lat/lng). PostGIS `ST_DWithin` on a `GEOGRAPHY` column gives meter-accurate results with a spatial index. Do not do manual Haversine math in Python.

**Why Sarvam over OpenAI/Claude?**
Sarvam is India-first — handles Hinglish, Hindi, and regional language queries natively. Also cheaper. Gemini Flash is fallback only.

**Why tool calling instead of a real MCP server?**
MCP server is out of scope for hackathon. Tool calling inside FastAPI achieves the same agentic loop — Sarvam decides when to call `search_vendors`, backend executes PostGIS query, result goes back to LLM for response formatting.

**Why UPI deep link instead of Paytm SDK?**
Paytm SDK integration is V2. Deep link (`paytm://pay?pa={upi_id}&pn={name}&cu=INR`) is sufficient for hackathon demo. Fallback: `https://paytm.me/{upi_id}` if app not installed. Payment Links API is not used in this version.

**One `vendors` table, separate from `users`.**
Vendors (supply side) and users (demand side) have different data shapes. Do not merge them into a single `users` table with nullable columns.

---

## API Contract

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/search/text` | Text search — `{query, lat, lng, radius_km}` |
| POST | `/api/search/voice` | Voice search — multipart `{audio_file, lat, lng, radius_km}` |
| POST | `/api/vendors` | Register vendor |
| GET | `/api/vendors/{id}` | Vendor profile |
| GET | `/api/categories` | Category list |
| GET | `/api/health` | Health check |

---

## AI Agent — Tool Spec

Tool name: `search_vendors`
Parameters: `category`, `keyword`, `lat`, `lng`, `radius_km`

PostGIS query pattern:
```sql
SELECT *, ST_Distance(location::geography, ST_MakePoint(:lng, :lat)::geography) AS distance_m
FROM shops
WHERE ST_DWithin(location::geography, ST_MakePoint(:lng, :lat)::geography, :radius_m)
  AND category = :category
  AND (name ILIKE '%:keyword%' OR description ILIKE '%:keyword%')
  AND is_active = true
ORDER BY distance_m ASC
LIMIT 5;
```

---

## Paytm Deep Link

```
paytm://pay?pa={upi_id}&pn={vendor_name}&cu=INR
```
Store `upi_id` on the `shops` table. Always validate UPI ID format on registration: `[a-zA-Z0-9._-]+@[a-zA-Z]+`

---

## What NOT To Do

- **Do not call Sarvam from the mobile app** — all AI calls happen on the backend only; mobile only records audio and sends it
- **Do not use Expo** — bare RN only, build environment is ready
- **Do not use synchronous SQLAlchemy** — async only (`asyncpg` driver)
- **Do not return more than 5 vendors** per search — keep demo clean
- **Do not skip the spatial index** — `CREATE INDEX USING GIST(location)` is mandatory for performance
- **Do not hardcode coordinates** — always use device GPS via `useLocation` hook
- **Do not merge vendor + user tables** — keep them separate
- **Do not burn Sarvam tokens on formatting** — use LLM only for intent extraction + final response; PostGIS does the actual filtering
- **Do not forget seed data** — demo has zero real vendors; seed script is mandatory before presenting

---

## Demo Checklist
- [ ] 15 mock vendors seeded within 2km of demo location
- [ ] Backend live on Railway
- [ ] APK built and installed on demo phone
- [ ] Google Maps API key active
- [ ] Sarvam STT tested with Hinglish query
- [ ] Paytm deep link tested on device
- [ ] Gemini fallback tested