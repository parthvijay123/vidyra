"""
Shared synchronous SQLAlchemy engine for non-async Vidyra components.

Used by: vector_store, rag tools, chat memory.
One pooled engine is shared instead of per-component instances.
"""

from sqlalchemy import create_engine

from app.core.config import settings

_sync_engine = None


def get_sync_engine():
    """Return (or lazily create) the shared synchronous SQLAlchemy engine."""
    global _sync_engine
    if _sync_engine is None:
        _sync_engine = create_engine(
            settings.PG_SYNC_URL,
            pool_pre_ping=True,
            pool_size=3,
            max_overflow=5,
        )
    return _sync_engine
