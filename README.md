# Dhundho

> Hyperlocal street-vendor discovery on top of Paytm's merchant network.

Speak or type *"bhai pani puri chahiye"* → an India-first AI agent (Sarvam) extracts
intent → a PostGIS radius query finds nearby vendors → pins drop on a map → tap a
vendor → pay over UPI via a Paytm deep link.

Vendors register with a short form (name, category, description, UPI ID); their GPS
location is captured and they go live on the map immediately.

---

## Architecture at a glance

```
Customer query (voice/text)
        │
        ▼
 FastAPI backend ── Sarvam STT (voice only) ── Sarvam LLM intent → {category, keyword}
        │                                              │ (Gemini Flash fallback)
        ▼                                              ▼
 PostGIS ST_DWithin radius search over the `shops` GEOGRAPHY column
        │
        ▼
 ≤5 nearest vendors → map pins → Paytm UPI deep link
```

**All AI calls happen on the backend only.** The mobile app records audio and POSTs it
as a multipart blob; API keys never leave the server.

---

## Monorepo layout

```
.
├── apps/
│   ├── backend/        # FastAPI + async SQLAlchemy 2.0 + PostGIS  (see apps/backend/CLAUDE.md)
│   └── mobile/         # Bare React Native, no Expo                (see apps/mobile/CLAUDE.md)
├── docker-compose.yml  # PostGIS db + backend
├── Spec.md             # BRD / PRD / FRD / SRS
├── Claude.md           # Product-wide engineering guide
├── turbo.json          # Turborepo pipeline
└── pnpm-workspace.yaml
```

Tooling: **pnpm** + **Turborepo** for JS/TS workspaces, **uv** for the Python backend.

---

## Tech stack

| Layer    | Tech |
|----------|------|
| Mobile   | Bare React Native, React Navigation v6, react-native-maps |
| Backend  | FastAPI, Uvicorn, SQLAlchemy 2.0 (async / `asyncpg`), Alembic |
| Database | PostgreSQL 15 + PostGIS 3.3 |
| AI       | Sarvam AI (STT + LLM intent extraction), Gemini Flash fallback |
| Deploy   | Railway (backend + DB via Docker) |

---

## Quick start

### 1. Backend + database (Docker)

```bash
cp apps/backend/.env.example apps/backend/.env   # fill SARVAM_API_KEY / GEMINI_API_KEY (optional for keyword-only search)
docker-compose up                                # starts PostGIS, runs migrations, serves on :8000
```

The backend container runs `alembic upgrade head` on boot (creates the PostGIS
extension, tables, GIST spatial index, and seed categories) before serving.

### 2. Backend only (local, against Dockerized DB)

```bash
docker-compose up -d db
cd apps/backend
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --port 8000
```

API docs: <http://localhost:8000/docs>

### 3. Mobile

The native `android/` project is **not generated yet** — see
[apps/mobile/README.md](apps/mobile/README.md) for the one-time bare-RN setup
(CLI init, AndroidManifest permissions, Maps key). After that:

```bash
pnpm install
pnpm --filter mobile start      # Metro
pnpm --filter mobile android    # build + install on device/emulator
```

Set `API_BASE_URL` and `GOOGLE_MAPS_API_KEY` in `apps/mobile/src/config.ts`
(use your machine's **LAN IP** on a physical device, not `localhost`).

---

## Environment variables

```env
# apps/backend/.env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/dhundho
SARVAM_API_KEY=
GEMINI_API_KEY=
ALLOWED_ORIGINS=*
```

```ts
// apps/mobile/src/config.ts
API_BASE_URL       // backend base URL (LAN IP on device)
GOOGLE_MAPS_API_KEY
```

Search degrades gracefully: with no `SARVAM_API_KEY` it falls back to a raw
keyword PostGIS search, so the API never hard-fails.

---

## API

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET  | `/api/health`            | Health check |
| GET  | `/api/categories`        | Category list |
| POST | `/api/vendors`           | Register a vendor (validates UPI `^[a-zA-Z0-9._-]+@[a-zA-Z]+$`) |
| GET  | `/api/vendors/{id}`      | Vendor profile |
| POST | `/api/search/text`       | Text search — `{query, lat, lng, radius_km}` |
| POST | `/api/search/voice`      | Voice search — multipart `{audio_file, lat, lng, radius_km}` |

Both search endpoints share the same intent-extraction + PostGIS path internally,
return **at most 5** vendors, and are kept separate so STT failures never affect
text search.

### Paytm deep link

```
paytm://pay?pa={upi_id}&pn={vendor_name}&cu=INR
```

Falls back to `https://paytm.me/{upi_id}` when the Paytm app isn't installed.

---

## Further reading

- [Spec.md](Spec.md) — full product spec (BRD / PRD / FRD / SRS)
- [Claude.md](Claude.md) — product-wide engineering conventions
- [apps/backend/CLAUDE.md](apps/backend/CLAUDE.md) — backend conventions & current state
- [apps/mobile/CLAUDE.md](apps/mobile/CLAUDE.md) — mobile conventions & native setup
