from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app.core.config import settings
from app.core.database import init_db, close_db
from app.modules.auth import auth_router
from app.modules.courses import courses_router
from app.modules.assets import assets_router
from app.modules.indexing import indexing_router
from app.modules.chat import chat_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialise the database on startup; clean up on shutdown."""
    await init_db()
    yield
    await close_db()


def build_app() -> FastAPI:
    application = FastAPI(
        title=settings.PROJECT_NAME,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        lifespan=lifespan,
    )

    # CORS — dynamically includes CLIENT_URL for production deployments
    cors_origins = settings.effective_cors_origins
    if cors_origins:
        application.add_middleware(
            CORSMiddleware,
            allow_origins=[str(o) for o in cors_origins],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    application.add_middleware(
        SessionMiddleware,
        secret_key=settings.SECRET_KEY,
        https_only=not settings.DEBUG,
    )

    # Route registration
    application.include_router(auth_router, prefix="/auth", tags=["auth"])
    application.include_router(courses_router, prefix="/classroom", tags=["courses"])
    application.include_router(assets_router, prefix="/files", tags=["assets"])
    application.include_router(indexing_router, prefix="/indexing", tags=["indexing"])
    application.include_router(chat_router, prefix="/chat", tags=["chat"])

    return application


app = build_app()


@app.get("/")
def root_handler():
    return {"message": "Vidyra API is running"}


@app.get("/health")
def health_handler():
    """Liveness probe for deployment orchestrators."""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "service": "vidyra-ai-tutor",
    }
