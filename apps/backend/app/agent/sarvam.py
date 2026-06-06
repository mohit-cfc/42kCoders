"""Sarvam AI integration — STUB. Not wired yet.

TODO (backend owner): implement the agent here, then plug it into
`app/api/search.py`:

  - transcribe(): Sarvam STT for POST /api/search/voice (endpoint not added yet).
  - run_agent(): in-process tool-calling loop. Extract {category, keyword} from
    the user's (Hindi/Hinglish) query, then call `app.agent.tools.search_vendors`.
    Gemini Flash is the fallback when Sarvam quota is exceeded.

See docs/Spec.md (FRD section 3) for the system prompt + search_vendors tool schema.
Search currently runs WITHOUT AI — it passes the raw query as a keyword.
"""


async def transcribe(audio_bytes: bytes, filename: str) -> str:
    raise NotImplementedError("Sarvam STT not wired yet")


async def run_agent(*args, **kwargs):
    raise NotImplementedError("Sarvam agent loop not wired yet")
