"""
Backward-compatibility re-exports for models.
Actual definitions live in app.models.schema.
"""
from app.models.schema import User, Course, File

__all__ = ["User", "Course", "File"]
