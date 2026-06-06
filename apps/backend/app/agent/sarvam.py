"""Sarvam AI integration — STT + single-shot intent extraction.

Per the locked design (see ../../tasks.md), the "agent" is NOT a tool-calling loop:
`extract_intent` makes ONE chat call that returns structured {category, keyword, language},
and the caller passes those straight into `app.agent.tools.search_vendors`. This keeps each
search well under the <1000 Sarvam-token target.

API contract (verified from docs.sarvam.ai):
  - STT:  POST {base}/speech-to-text          multipart file + model + language_code
  - Chat: POST {base}/v1/chat/completions      OpenAI-shaped messages/choices

Auth note: STT docs show the `api-subscription-key` header; the /v1/chat docs show
`Authorization: Bearer`. We send BOTH so the same key works on either endpoint.
"""

from __future__ import annotations

import json
import logging

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

# Categories the DB knows about (categories table / Spec FRD §3). The LLM must map to one
# of these or null; anything else is coerced to null so we don't filter on a bogus category.
ALLOWED_CATEGORIES = {"food", "repair", "utility", "beauty", "other"}

_INTENT_SYSTEM_PROMPT = (
    "You are Dhundho, a hyperlocal street-vendor search assistant for India. "
    "The user's query may be in Hindi, Marathi, or Hinglish. It could also be in any other 22 Indian langugaes that you support. "
    "Extract the vendor category and the core search keyword. "
    "Respond with ONLY a single minified JSON object, no prose, no markdown fences:\n"
    '{"category": <one of "food"|"repair"|"utility"|"beauty"|"other" or null>, '
    '"keyword": <short item the user wants, e.g. "pani puri", "chappal", "photocopy">, '
    '"language": <BCP-47 code of the query, e.g. "hi-IN", "en-IN", "mr-IN">}\n'
    "If no category clearly fits, use null. Keyword should be the item itself, not a sentence."
)


def _headers() -> dict[str, str]:
    key = settings.SARVAM_API_KEY
    return {"api-subscription-key": key, "Authorization": f"Bearer {key}"}


async def transcribe(
    audio_bytes: bytes, filename: str, language_code: str = "unknown"
) -> str:
    """Sarvam STT. Returns the transcript text. Raises on HTTP/transport error."""
    url = f"{settings.SARVAM_BASE_URL}/speech-to-text"
    files = {"file": (filename, audio_bytes)}
    data = {"model": settings.SARVAM_STT_MODEL, "language_code": language_code}
    async with httpx.AsyncClient(timeout=settings.SARVAM_TIMEOUT_S) as client:
        resp = await client.post(url, headers=_headers(), files=files, data=data)
        resp.raise_for_status()
        return resp.json()["transcript"]


def _parse_intent_json(content: str) -> dict:
    """Defensively pull the intent object out of the model's text.

    Sarvam has no JSON mode, so the content may have ```json fences or stray prose.
    We extract the first {...} block, parse it, and sanitise the fields.
    """
    start, end = content.find("{"), content.rfind("}")
    if start == -1 or end == -1 or end < start:
        raise ValueError(f"no JSON object in chat response: {content!r}")
    obj = json.loads(content[start : end + 1])

    category = obj.get("category")
    if category not in ALLOWED_CATEGORIES:
        category = None
    keyword = obj.get("keyword") or None
    if isinstance(keyword, str):
        keyword = keyword.strip() or None
    return {"category": category, "keyword": keyword, "language": obj.get("language")}


async def extract_intent(query: str) -> dict:
    """Single-shot intent extraction. Returns {category, keyword, language}.

    Raises on HTTP/transport/parse failure so the caller can fall back to keyword search.
    """
    url = f"{settings.SARVAM_BASE_URL}/v1/chat/completions"
    payload = {
        "model": settings.SARVAM_CHAT_MODEL,
        "messages": [
            {"role": "system", "content": _INTENT_SYSTEM_PROMPT},
            {"role": "user", "content": query},
        ],
        "temperature": 0.1,
        "max_tokens": 150,
        "reasoning_effort": "low",
    }
    async with httpx.AsyncClient(timeout=settings.SARVAM_TIMEOUT_S) as client:
        resp = await client.post(url, headers=_headers(), json=payload)
        resp.raise_for_status()
        body = resp.json()

    usage = body.get("usage", {})
    logger.info("sarvam intent tokens=%s", usage.get("total_tokens"))
    content = body["choices"][0]["message"]["content"]
    return _parse_intent_json(content)


async def _gemini_fallback(query: str) -> dict:
    """Gemini Flash fallback for when Sarvam quota is exceeded.

    TODO: wire Gemini Flash (GEMINI_API_KEY). Stubbed for now — callers treat a raised
    exception as "no AI available" and fall back to raw-keyword search.
    """
    raise NotImplementedError("Gemini Flash fallback not wired yet")
