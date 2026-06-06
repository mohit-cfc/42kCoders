# Dhundho Backend — CLAUDE.md
> FastAPI + async SQLAlchemy 2.0 + PostGIS API for hyperlocal street-vendor discovery.
> Scoped to `apps/backend`. The root `../../CLAUDE.md` covers the whole product — read it for context.

---

## Structure
```
app/
├── main.py            # FastAPI app: CORS + router includes
├── core/config.py     # pydantic-settings (DATABASE_URL, SARVAM/GEMINI keys, MAX_RESULTS, DEFAULT_RADIUS_KM)
├── db/
│   ├── base.py        # DeclarativeBase
│   ├── session.py     # async engine + async_sessionmaker + get_session() dependency
│   └── models.py      # SQLAlchemy 2.0 models — the schema of record
├── schemas.py         # Pydantic request/response models (the API contract)
├── api/
│   ├── health.py      # GET /api/health
│   ├── vendors.py     # POST /api/vendors, GET /api/vendors/{id}, GET /api/categories
│   └── search.py      # POST /api/search/text
└── agent/
    ├── tools.py       # search_vendors() — the core PostGIS query (REAL)
    └── sarvam.py      # STUB — AI not wired yet
alembic/               # async migrations; 0001_init.py owns the postgis extension + GIST index
```

---

## Conventions
- **Async SQLAlchemy only** (`asyncpg` driver). Never use the sync API.
- **Geo via PostGIS, never Python.** Radius/distance use `ST_DWithin` / `ST_Distance` on the `GEOGRAPHY(POINT,4326)` column. The query lives in `app/agent/tools.py` as a parameterized `text()` statement — do not do Haversine math in Python.
- **In-process tool calling, not MCP.** `search_vendors` is a plain async function the search endpoint (and, later, the Sarvam agent) calls directly. There is no MCP server.
- **`vendors` and `users` stay separate tables** — different data shapes; do not merge.
- **Max 5 results** per search (`settings.MAX_RESULTS`).
- **Validate UPI on registration**: regex `^[a-zA-Z0-9._-]+@[a-zA-Z]+$` (in `schemas.VendorCreate`).
- The GIST spatial index is owned by the migration, so the model column sets `spatial_index=False`. Keep it that way to avoid a duplicate-index conflict.

---

## Current state / stubs
- **Search is keyword-only — no AI yet.** `POST /api/search/text` passes the raw `query` straight into `search_vendors` as the keyword. The `# TODO` in `app/api/search.py` marks where the Sarvam agent loop plugs in.
- **`app/agent/sarvam.py` is a stub** (`transcribe()` / `run_agent()` raise `NotImplementedError`). When implementing: extract `{category, keyword}` from the query, call `tools.search_vendors`, and add Gemini Flash as the quota fallback. System prompt + tool schema are in `../../Spec.md` (FRD §3).
- **No `POST /api/search/voice` yet** — add it alongside `transcribe()`; keep it a separate handler so STT failures don't affect text search.
- **No seed script yet** — DB is empty after migration except the 5 categories inserted by `0001_init.py`.

---

## Running locally
```bash
docker-compose up -d db          # from repo root; postgis/postgis:15-3.3
cp .env.example .env             # then fill keys if needed
uv sync                          # lockfiles are stale after the rewrite — run `uv lock` first if sync fails
uv run alembic upgrade head      # creates postgis extension, tables, GIST index, seed categories
uv run uvicorn app.main:app --reload --port 8000
```

---

## Endpoints
| Method | Endpoint | Status |
|--------|----------|--------|
| GET | `/api/health` | ✅ |
| GET | `/api/categories` | ✅ |
| POST | `/api/vendors` | ✅ |
| GET | `/api/vendors/{id}` | ✅ |
| POST | `/api/search/text` | ✅ (keyword-only, no AI) |
| POST | `/api/search/voice` | ⬜ planned (needs Sarvam STT) |

---

## Do NOT
- Use synchronous SQLAlchemy.
- Do distance math in Python — PostGIS does the filtering.
- Reintroduce MCP servers — tool calling is in-process.
- Merge the `vendors` and `users` tables.
- Drop or skip the `idx_shops_location` GIST index.
- Return more than 5 vendors per search.
