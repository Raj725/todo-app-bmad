from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class TodoCreateRequest(BaseModel):
    description: str = Field(min_length=1, max_length=280)

    @field_validator("description")
    @classmethod
    def validate_description(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("description must not be empty")
        return normalized


class TodoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    description: str
    is_completed: bool
    created_at: datetime


class TodoUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    is_completed: bool
