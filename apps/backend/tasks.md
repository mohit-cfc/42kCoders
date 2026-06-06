# Dhundho Backend — Implementation Tasks

> Remaining backend work: the AI layer + demo readiness. The skeleton (models, migration,
> async session, CORS app, `search_vendors` PostGIS query, vendor/category/health endpoints,
> keyword-only text search) is already built and working.
>
> **Workflow:** Implementation is split into milestones. Code is reviewed after **every**
> milestone before the next begins. `[ ]` = todo, `[~]` = in progress, `[x]` = done & reviewed.

## Decisions (locked)
- **Agent = single-shot intent extraction** — one LLM call → `{category, keyword, language}`,
  then `search_vendors` directly. No tool-calling loop, no second "friendly reply" call.
  Keeps us under the <1000 token/search target. `interpreted_query` = extracted keyword.
- **Live Sarvam API**, contract verified from docs.sarvam.ai.
- **Manual / demo verification only** — no pytest suite.
- **Gemini fallback: stubbed now, wired later.**

## Verified Sarvam API contract
- **STT:** `POST https://api.sarvam.ai/speech-to-text` — multipart `file` + `model=saarika:v2.5`
  + `language_code=unknown`. Header `api-subscription-key`. Resp `{transcript, language_code, ...}`.
- **Chat:** `POST https://api.sarvam.ai/v1/chat/completions` — OpenAI-shaped
  (`messages`, `model=sarvam-m`, `temperature`, `max_tokens`, `reasoning_effort`).
  Resp `choices[0].message.content`. **No JSON mode** → prompt for JSON + parse defensively.
- **Auth gotcha:** STT uses `api-subscription-key`; chat docs show `Authorization: Bearer`.
  Client sends both; verify against live key in M1.

---

## Milestone 1 — Sarvam client + intent extraction → text search
**Goal:** `POST /api/search/text` runs a real Sarvam intent call; degrades gracefully to
raw-keyword search if Sarvam is unavailable (text search never hard-fails).

- [ ] Add `httpx>=0.27` to `pyproject.toml`
- [ ] Add Sarvam settings to `app/core/config.py` (`SARVAM_BASE_URL`, `SARVAM_STT_MODEL`,
      `SARVAM_CHAT_MODEL`, `SARVAM_TIMEOUT_S`)
- [ ] Implement `app/agent/sarvam.py`: shared async httpx client, `transcribe()`,
      `extract_intent()` (strict-JSON prompt + defensive parse), `_gemini_fallback()` stub
- [ ] Wire `extract_intent` into `app/api/search.py` `/text` with try/except graceful fallback
- [ ] Update `.env.example` with Sarvam vars
- [ ] **REVIEW CHECKPOINT**

## Milestone 2 — `POST /api/search/voice`
**Goal:** Transcribe audio via Sarvam STT, then run the same intent→PostGIS path. STT failure
isolated (clean 502), does not affect text search.

- [ ] Add `VoiceSearchResponse` (SearchResponse + optional `transcript`) to `app/schemas.py`
- [ ] Extract shared `intent → search_vendors` helper (used by text + voice)
- [ ] Add `/voice` multipart handler to `app/api/search.py` (validate ≤10MB + audio type)
- [ ] STT-failure → 502 with clear message
- [ ] **REVIEW CHECKPOINT**

## Milestone 3 — Seed script
**Goal:** One command seeds 15 demo vendors within ~2km of a configurable demo center.

- [ ] `scripts/seed.py` — async, idempotent (clears prior seed rows), env-configurable center
- [ ] 15 Hinglish vendors across food / repair / utility, valid UPI IDs, inside 2km
- [ ] Use `ST_SetSRID(ST_MakePoint(lng, lat), 4326)` (mirrors `create_vendor`)
- [ ] Runnable via `uv run python scripts/seed.py`
- [ ] **REVIEW CHECKPOINT**

---

## Out of scope (per decisions)
- Full Sarvam tool-calling agentic loop · second LLM "friendly reply" call ·
  actual Gemini Flash wiring (stub only) · automated pytest suite.

## Manual end-to-end verification
1. `docker-compose up -d db`; in `apps/backend`: `uv sync`, `uv run alembic upgrade head`
2. `uv run python scripts/seed.py` → 15 vendors
3. `uv run uvicorn app.main:app --reload --port 8000`
4. Text: `POST /api/search/text {"query":"bhai pani puri chahiye","lat":18.5204,"lng":73.8567,"radius_km":2}`
   → pani-puri vendors, `interpreted_query≈"pani puri"`. Empty key → keyword fallback, no 500.
5. Voice: `POST /api/search/voice` multipart `audio_file,lat,lng,radius_km` → vendors + transcript.
6. Confirm <1000 tokens/search via chat `usage`.
