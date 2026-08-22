"""
Auth module — Google OAuth routes and the get_current_user dependency.

Routes:
  GET  /auth/login      → Initiate OAuth flow
  GET  /auth/callback   → Exchange code, set cookies
  POST /auth/refresh    → Rotate token pair
  POST /auth/logout     → Clear session and cookies
  GET  /auth/me         → Return current user profile
"""

import secrets
from urllib.parse import urlparse

from fastapi import APIRouter, Request, Response, Depends, HTTPException, status
from fastapi.responses import RedirectResponse, JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.services.google_auth import GoogleAuthService
from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_token_pair, verify_token
from app.core.exceptions import GoogleAuthError, to_http_exception
from app.models.schema import User

auth_router = APIRouter()
_google_auth = GoogleAuthService()


# ── Origin helpers ────────────────────────────────────────────────

def _parse_origin(url: str) -> str | None:
    parsed = urlparse(url.strip())
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        return None
    return f"{parsed.scheme}://{parsed.netloc}".rstrip("/")


def _is_allowed_origin(frontend_redirect: str) -> bool:
    origin = _parse_origin(frontend_redirect)
    if not origin:
        return False
    allowed = {
        o for o in (
            _parse_origin(str(item)) for item in settings.effective_cors_origins
        ) if o
    }
    return origin in allowed


# ── Cookie helpers ────────────────────────────────────────────────

def _resolve_secure() -> bool:
    if settings.AUTH_COOKIE_SECURE is not None:
        return settings.AUTH_COOKIE_SECURE
    return not settings.DEBUG


def _resolve_samesite() -> str:
    value = (settings.AUTH_COOKIE_SAMESITE or "lax").lower()
    return value if value in {"lax", "strict", "none"} else "lax"


def _base_cookie_kwargs(httponly: bool) -> dict:
    kwargs: dict[str, str | bool] = {
        "httponly": httponly,
        "secure": _resolve_secure(),
        "samesite": _resolve_samesite(),
        "path": settings.AUTH_COOKIE_PATH or "/",
    }
    if settings.AUTH_COOKIE_DOMAIN:
        kwargs["domain"] = settings.AUTH_COOKIE_DOMAIN
    return kwargs


def _attach_csrf_cookie(response: Response, existing: str | None = None) -> str:
    token = existing or secrets.token_urlsafe(32)
    response.set_cookie(
        key=settings.CSRF_COOKIE_NAME,
        value=token,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        **_base_cookie_kwargs(httponly=False),
    )
    return token


def _remove_csrf_cookie(response: Response) -> None:
    response.delete_cookie(settings.CSRF_COOKIE_NAME, **_base_cookie_kwargs(httponly=False))


def _attach_auth_cookies(
    response: Response, access_token: str, refresh_token: str, request: Request | None = None
) -> None:
    if not settings.AUTH_COOKIE_ENABLED:
        return
    kw = _base_cookie_kwargs(httponly=True)
    response.set_cookie(
        key=settings.AUTH_COOKIE_ACCESS_NAME,
        value=access_token,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        **kw,
    )
    response.set_cookie(
        key=settings.AUTH_COOKIE_REFRESH_NAME,
        value=refresh_token,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        **kw,
    )
    existing_csrf = request.cookies.get(settings.CSRF_COOKIE_NAME) if request else None
    _attach_csrf_cookie(response, existing=existing_csrf)


def _remove_auth_cookies(response: Response) -> None:
    kw = _base_cookie_kwargs(httponly=True)
    response.delete_cookie(settings.AUTH_COOKIE_ACCESS_NAME, **kw)
    response.delete_cookie(settings.AUTH_COOKIE_REFRESH_NAME, **kw)
    _remove_csrf_cookie(response)


# ── CSRF guard ────────────────────────────────────────────────────

def _guard_csrf(request: Request) -> None:
    if not settings.CSRF_PROTECTION_ENABLED:
        return
    if request.method.upper() not in {"POST", "PUT", "PATCH", "DELETE"}:
        return
    cookie = request.cookies.get(settings.CSRF_COOKIE_NAME)
    header = request.headers.get(settings.CSRF_HEADER_NAME)
    if not cookie or not header:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Missing CSRF token")
    if not secrets.compare_digest(cookie, header):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "CSRF token mismatch")


# ── Callback URL builder ──────────────────────────────────────────

def _resolve_callback_url(frontend_redirect: str | None) -> str | None:
    if frontend_redirect and _is_allowed_origin(frontend_redirect):
        return frontend_redirect.split("#", 1)[0]
    if settings.FRONTEND_URL:
        base = settings.FRONTEND_URL.rstrip("/")
        path = settings.FRONTEND_AUTH_CALLBACK_PATH.strip() or "/auth/callback"
        if not path.startswith("/"):
            path = f"/{path}"
        return f"{base}{path}"
    return None


# ── Routes ────────────────────────────────────────────────────────

@auth_router.get("/login")
async def initiate_login(
    request: Request,
    redirect: bool = True,
    frontend_redirect: str | None = None,
):
    """Begin Google OAuth authorization flow."""
    auth_url, state, code_verifier = _google_auth.get_authorization_url()
    request.session["oauth_state"] = state
    request.session["oauth_code_verifier"] = code_verifier

    if frontend_redirect and _is_allowed_origin(frontend_redirect):
        request.session["frontend_redirect"] = frontend_redirect
    else:
        request.session.pop("frontend_redirect", None)

    if redirect:
        return RedirectResponse(auth_url)
    return {"authorization_url": auth_url, "state": state}


@auth_router.get("/callback")
async def handle_oauth_callback(
    request: Request,
    code: str,
    state: str,
    db: AsyncSession = Depends(get_db),
):
    """Complete Google OAuth exchange and issue session cookies."""
    stored_state = request.session.get("oauth_state")
    if not stored_state or state != stored_state:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "OAuth state mismatch")

    try:
        code_verifier = request.session.get("oauth_code_verifier")
        token_info = await _google_auth.exchange_code_for_tokens(code, code_verifier)
        google_user = await _google_auth.get_user_info(token_info)
        user = await _google_auth.create_or_update_user(db, google_user, token_info)
        tokens = create_token_pair(user.id)

        request.session.pop("oauth_state", None)
        request.session.pop("oauth_code_verifier", None)
        frontend_redirect = request.session.pop("frontend_redirect", None)

        callback_url = _resolve_callback_url(frontend_redirect)

        if callback_url:
            resp = RedirectResponse(url=callback_url, status_code=status.HTTP_303_SEE_OTHER)
        else:
            resp = JSONResponse(content={
                "message": "Sign-in successful",
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "name": user.name,
                    "picture": user.picture,
                },
            })

        _attach_auth_cookies(resp, tokens["access_token"], tokens["refresh_token"], request)
        return resp

    except GoogleAuthError as exc:
        raise to_http_exception(exc)
    except Exception as exc:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Sign-in failed: {exc}")


@auth_router.post("/refresh")
async def rotate_tokens(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """Rotate the JWT token pair using the HttpOnly refresh cookie."""
    _guard_csrf(request)

    refresh_cookie = request.cookies.get(settings.AUTH_COOKIE_REFRESH_NAME)
    if not refresh_cookie:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Refresh token not found")

    user_id = verify_token(refresh_cookie, token_type="refresh")
    if not user_id:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Refresh token is invalid or expired")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Account not found or deactivated")

    tokens = create_token_pair(user.id)
    _attach_auth_cookies(response, tokens["access_token"], tokens["refresh_token"], request)
    return {"message": "Session renewed successfully"}


@auth_router.post("/logout")
async def sign_out(request: Request):
    """Invalidate the session and remove all auth cookies."""
    _guard_csrf(request)
    request.session.clear()
    resp = JSONResponse(content={"message": "Signed out successfully"})
    _remove_auth_cookies(resp)
    return resp


# ── Shared dependency ─────────────────────────────────────────────

async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    FastAPI dependency: resolve the authenticated user from the access cookie.

    Raises HTTP 401 on missing, invalid, or expired token.
    """
    _guard_csrf(request)

    token = request.cookies.get(settings.AUTH_COOKIE_ACCESS_NAME)
    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Authentication required")

    user_id = verify_token(token, token_type="access")
    if not user_id:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Session expired — please sign in again")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Account not found")

    return user


@auth_router.get("/me")
async def current_user_profile(user: User = Depends(get_current_user)):
    """Return the authenticated user's profile."""
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "picture": user.picture,
        "created_at": user.created_at.isoformat(),
        "last_login": user.last_login.isoformat() if user.last_login else None,
    }

