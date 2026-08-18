"""
Domain exception types for Vidyra.

All service-layer errors inherit from VidyraError.
Route handlers convert them to HTTPException via to_http_exception().
"""

from fastapi import HTTPException, status


class VidyraError(Exception):
    """Base class for all Vidyra application errors."""
    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_message: str = "An unexpected error occurred."

    def __init__(self, message: str | None = None):
        self.message = message or self.default_message
        super().__init__(self.message)


class AuthenticationError(VidyraError):
    """Raised when a user is not authenticated or credentials are invalid."""
    status_code = status.HTTP_401_UNAUTHORIZED
    default_message = "Authentication required."


class GoogleAuthError(VidyraError):
    """Raised during Google OAuth exchange failures."""
    status_code = status.HTTP_401_UNAUTHORIZED
    default_message = "Google authentication failed."


class PermissionDeniedError(VidyraError):
    """Raised when a user lacks permission for the requested resource."""
    status_code = status.HTTP_403_FORBIDDEN
    default_message = "You do not have permission to access this resource."


class ResourceNotFoundError(VidyraError):
    """Raised when a requested resource does not exist."""
    status_code = status.HTTP_404_NOT_FOUND
    default_message = "The requested resource was not found."


class ConflictError(VidyraError):
    """Raised on duplicate-resource or state-conflict violations."""
    status_code = status.HTTP_409_CONFLICT
    default_message = "A conflict occurred with the current state of the resource."


class ProcessingError(VidyraError):
    """Raised when a background processing task fails."""
    status_code = getattr(status, "HTTP_422_UNPROCESSABLE_CONTENT", 422)
    default_message = "Failed to process the resource."


class ClassroomAPIError(VidyraError):
    """Raised when Google Classroom API calls fail."""
    status_code = status.HTTP_502_BAD_GATEWAY
    default_message = "Failed to communicate with Google Classroom API."


class DriveAPIError(VidyraError):
    """Raised when Google Drive API calls fail."""
    status_code = status.HTTP_502_BAD_GATEWAY
    default_message = "Failed to communicate with Google Drive API."


def to_http_exception(error: VidyraError) -> HTTPException:
    """Convert a VidyraError into a FastAPI HTTPException."""
    return HTTPException(
        status_code=error.status_code,
        detail=error.message,
    )
