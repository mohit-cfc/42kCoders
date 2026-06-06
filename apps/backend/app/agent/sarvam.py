"""AI integration — Sarvam STT + single-shot intent extraction, with a Gemini Flash fallback.

Per the locked design (see ../../tasks.md), the "agent" is NOT a tool-calling loop:
`extract_intent` makes ONE chat call that returns structured {category, keyword, language},
and the caller passes those straight into `app.agent.tools.search_vendors`. This keeps each
search well under the <1000 Sarvam-token target. Sarvam chat models: sarvam-30b | sarvam-105b.

`extract_intent` tries Sarvam first and falls back to Gemini Flash if Sarvam fails (quota,
timeout, parse error). It raises only if BOTH fail, so the search endpoint can then drop to
raw-keyword search.

API contracts (verified from provider docs):
  - Sarvam STT:  POST {base}/speech-to-text          multipart file + model + language_code
  - Sarvam Chat: POST {base}/v1/chat/completions      OpenAI-shaped messages/choices
  - Gemini:      POST {base}/v1beta/models/{model}:generateContent  (native JSON mode)

Auth note: Sarvam STT docs show the `api-subscription-key` header; the /v1/chat docs show
`Authorization: Bearer`. We send BOTH so the same key works on either endpoint. Gemini uses
the `x-goog-api-key` header.
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
    "If no category clearly fits, use null. Keyword should be the item itself, not a sentence. "
    "If the query is NOT about finding a vendor, shop, product, or service "
    "(e.g. weather, jokes, general chit-chat), set BOTH category and keyword to null."
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
        if resp.is_error:
            logger.warning("sarvam STT %s: %s", resp.status_code, resp.text)
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

    Tries Sarvam first; on any failure (quota, timeout, parse error) falls back to Gemini
    Flash. Raises only if BOTH providers fail, so the caller can drop to raw-keyword search.
    """
    try:
        return await _extract_intent_sarvam(query)
    except Exception:  # noqa: BLE001 — Sarvam down/quota
        # Gemini fallback temporarily disabled (quota exceeded). Re-raise so the search
        # endpoint drops to raw-keyword search — do NOT return both-null here, that would
        # be read as an off-topic query and yield an empty result instead.
        logger.warning("Sarvam intent failed; falling back to keyword search", exc_info=True)
        raise
        # When Gemini quota is back, restore the fallback (and drop the `raise` above):
        # return await _gemini_fallback(query)


async def _extract_intent_sarvam(query: str) -> dict:
    url = f"{settings.SARVAM_BASE_URL}/v1/chat/completions"
    payload = {
        "model": settings.SARVAM_CHAT_MODEL,
        "messages": [
            {"role": "system", "content": _INTENT_SYSTEM_PROMPT},
            {"role": "user", "content": query},
        ],
        "temperature": 0.1,
        "max_tokens": 300,
        # sarvam-30b/105b are reasoning models. With reasoning on they spend the token
        # budget "thinking" and return content=null. Intent extraction needs no reasoning,
        # so disable it (docs: reasoning_effort can be disabled by setting to None).
        "reasoning_effort": None,
    }
    async with httpx.AsyncClient(timeout=settings.SARVAM_TIMEOUT_S) as client:
        resp = await client.post(url, headers=_headers(), json=payload)
        if resp.is_error:
            logger.warning("sarvam chat %s: %s", resp.status_code, resp.text)
        resp.raise_for_status()
        body = resp.json()

    usage = body.get("usage", {})
    logger.info("sarvam intent tokens=%s", usage.get("total_tokens"))
    content = body["choices"][0]["message"].get("content")
    if not content:
        # Empty content (e.g. reasoning consumed the budget) — fail cleanly so the caller
        # can fall back, and log the body so we can see what came back.
        raise ValueError(f"sarvam returned empty content: {body}")
    return _parse_intent_json(content)


# Gemini's structured-output schema (OpenAPI subset) — forces clean JSON, no fences.
_GEMINI_INTENT_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "category": {"type": "STRING", "nullable": True},
        "keyword": {"type": "STRING", "nullable": True},
        "language": {"type": "STRING", "nullable": True},
    },
}


async def _gemini_fallback(query: str) -> dict:
    """Gemini Flash fallback for intent extraction when Sarvam is unavailable.

    Uses Gemini's native JSON mode (responseMimeType + responseSchema). Raises if the key
    is unset or the call fails, so the caller drops to raw-keyword search.
    """
    if not settings.GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY not set")

    url = f"{settings.GEMINI_BASE_URL}/v1beta/models/{settings.GEMINI_MODEL}:generateContent"
    payload = {
        "system_instruction": {"parts": [{"text": _INTENT_SYSTEM_PROMPT}]},
        "contents": [{"role": "user", "parts": [{"text": query}]}],
        "generationConfig": {
            "temperature": 0.1,
            "maxOutputTokens": 150,
            "responseMimeType": "application/json",
            "responseSchema": _GEMINI_INTENT_SCHEMA,
        },
    }
    async with httpx.AsyncClient(timeout=settings.SARVAM_TIMEOUT_S) as client:
        resp = await client.post(
            url, headers={"x-goog-api-key": settings.GEMINI_API_KEY}, json=payload
        )
        if resp.is_error:
            logger.warning("gemini %s: %s", resp.status_code, resp.text)
        resp.raise_for_status()
        body = resp.json()

    usage = body.get("usageMetadata", {})
    logger.info("gemini intent tokens=%s", usage.get("totalTokenCount"))
    content = body["candidates"][0]["content"]["parts"][0]["text"]
    return _parse_intent_json(content)
