"""
Shared utility helpers for Vidyra.

Provides:
  - detect_file_type(mime_type, file_name)  → normalised file type
  - detect_source_type(file_name)           → citation source label
  - validate_groq_key(key)                  → raises ValueError if invalid
  - build_groq_client(api_key)              → configured Groq client
"""

import logging
from typing import Optional

logger = logging.getLogger(__name__)


# ── File-type detection ───────────────────────────────────────────

def detect_file_type(mime_type: Optional[str], file_name: str) -> str:
    """
    Determine normalised file type from MIME type and filename extension.

    Returns:
        ``"pdf"``, ``"image"``, ``"text"``, or ``"unknown"``
    """
    mime = (mime_type or "").lower()
    name = file_name.lower()

    if mime == "application/pdf" or name.endswith(".pdf"):
        return "pdf"

    if mime.startswith("image/") or name.endswith(
        (".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tiff")
    ):
        return "image"

    if name.endswith((".doc", ".docx", ".ppt", ".pptx", ".txt", ".md", ".rtf")):
        return "text"

    if mime.startswith("text/") or any(
        kw in mime for kw in ("document", "msword", "wordprocessing")
    ):
        return "text"

    logger.warning("[detect_file_type] Unrecognised type: mime=%s, file=%s", mime, name)
    return "unknown"


def detect_source_type(file_name: str) -> str:
    """
    Map a filename to a citation source label.

    Returns:
        ``"pdf"``, ``"image"``, or ``"document"``
    """
    file_type = detect_file_type(None, file_name)
    if file_type in {"pdf", "image"}:
        return file_type
    return "document"


# ── Groq helpers ─────────────────────────────────────────────────

def validate_groq_key(key: str) -> None:
    """
    Validate a Groq API key's basic format.

    Raises:
        ValueError if the key is absent or malformed.
    """
    if not key or not isinstance(key, str):
        raise ValueError("Groq API key is missing or not a string.")
    if not key.startswith("gsk_") or len(key) < 20:
        raise ValueError("Invalid Groq API key format.")
    logger.debug("Groq API key validated.")


def build_groq_client(api_key: str):
    """
    Construct and return a ready-to-use Groq client.

    Raises:
        ValueError if the API key is invalid.
    """
    validate_groq_key(api_key)
    try:
        from groq import Groq  # lazy import to keep startup fast
        client = Groq(api_key=api_key)
        logger.info("Groq client initialised successfully.")
        return client
    except Exception as exc:
        logger.error("Failed to initialise Groq client: %s", exc)
        raise


# Backward-compatibility alias
create_groq_client = build_groq_client
