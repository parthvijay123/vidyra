from typing import List, Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class VidyraSettings(BaseSettings):
    """Central configuration for the Vidyra backend service."""

    PROJECT_NAME: str = "Vidyra Backend"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = False

    # CORS — extend via CLIENT_URL env var for production deployments
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
    ]
    CLIENT_URL: Optional[str] = None  # Production frontend origin (e.g. https://vidyra.vercel.app)

    # Token security
    JWT_SECRET: str = "change_me_vidyra_jwt_secret"
    FERNET_KEY: str = "change_me_vidyra_fernet_key"
    SECRET_KEY: str = "change_me_vidyra_session_secret"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # Cookie configuration
    AUTH_COOKIE_ENABLED: bool = True
    AUTH_COOKIE_ACCESS_NAME: str = "vidyra_access_token"
    AUTH_COOKIE_REFRESH_NAME: str = "vidyra_refresh_token"
    AUTH_COOKIE_DOMAIN: Optional[str] = None
    AUTH_COOKIE_PATH: str = "/"
    AUTH_COOKIE_SECURE: Optional[bool] = None
    AUTH_COOKIE_SAMESITE: str = "lax"

    # CSRF double-submit token
    CSRF_PROTECTION_ENABLED: bool = True
    CSRF_COOKIE_NAME: str = "vidyra_csrf_token"
    CSRF_HEADER_NAME: str = "X-CSRF-Token"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/vidyra_db"

    # File storage
    UPLOAD_DIR: str = "./uploads"

    # Google OAuth
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GOOGLE_REDIRECT_URI: Optional[str] = "http://localhost:8000/auth/callback"
    FRONTEND_URL: Optional[str] = None
    FRONTEND_AUTH_CALLBACK_PATH: str = "/auth/callback"

    # Embedding / vector store
    EMBEDDING_MODEL: str = "BAAI/bge-base-en-v1.5"
    VECTOR_EMBEDDING_DIM: int = 768
    PGVECTOR_ENABLE_FTS_GIN_INDEX: bool = True
    PGVECTOR_ENABLE_HNSW: bool = True
    PGVECTOR_AUTO_MIGRATE_VECTOR_DIMENSION: bool = True
    PGVECTOR_HNSW_M: int = 16
    PGVECTOR_HNSW_EF_CONSTRUCTION: int = 64

    # AI model selection
    AGENT_MODEL: str = "openai/gpt-oss-120b"
    JSON_MODEL: str = "openai/gpt-oss-20b"
    WEB_SEARCH_MODEL: str = "groq/compound-mini"
    QUERY_REWRITE_MODEL: str = "llama-3.1-8b-instant"
    SUMMARY_MODEL: str = "llama-3.3-70b-versatile"
    VISION_MODEL: str = "meta-llama/llama-4-scout-17b-16e-instruct"
    PDF_EXTRACT_IMAGES: bool = False

    # RAG pipeline tuning
    RAG_LLM_TEMPERATURE: float = 0.3
    RAG_RETRIEVER_K: int = 8
    RAG_RETRIEVER_FETCH_K: int = 50
    RAG_ENABLE_RERANK: bool = False
    RAG_RERANK_TOP_N: int = 5
    RAG_RERANK_MODEL: str = "ms-marco-MiniLM-L-12-v2"
    RAG_RERANK_SCORE_THRESHOLD: float = 0.0
    RAG_CHUNK_SIZE: int = 800
    RAG_CHUNK_OVERLAP: int = 200
    RAG_PARENT_CHUNK_SIZE: int = 1600

    # External service keys
    GROQ_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    GOOGLE_API_KEY: Optional[str] = None
    NOMIC_API_KEY: Optional[str] = None
    SUPABASE_URL: Optional[str] = None
    SUPABASE_KEY: Optional[str] = None

    @property
    def effective_cors_origins(self) -> List[str]:
        """Return all allowed CORS origins, including CLIENT_URL when set."""
        origins = list(self.BACKEND_CORS_ORIGINS)
        if self.CLIENT_URL and self.CLIENT_URL not in origins:
            origins.append(self.CLIENT_URL)
        if self.FRONTEND_URL and self.FRONTEND_URL not in origins:
            origins.append(self.FRONTEND_URL)
        return origins

    @property
    def PG_SYNC_URL(self) -> str:
        """Synchronous SQLAlchemy URL for pgvector operations."""
        url = self.DATABASE_URL.replace("+asyncpg", "+psycopg")
        sep = "&" if "?" in url else "?"
        return url + sep + "sslmode=require"

    @property
    def PG_CONNINFO(self) -> str:
        """Plain psycopg3 connection string for direct psycopg usage."""
        url = self.DATABASE_URL.replace("+asyncpg", "")
        sep = "&" if "?" in url else "?"
        return url + sep + "sslmode=require&options=-c%20statement_timeout%3D180000"

    model_config = SettingsConfigDict(
        env_file=".env", case_sensitive=True, extra="ignore"
    )


settings = VidyraSettings()
