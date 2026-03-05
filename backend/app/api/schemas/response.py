from typing import Generic, TypeVar

from pydantic import BaseModel


PayloadType = TypeVar("PayloadType")


class SuccessResponse(BaseModel, Generic[PayloadType]):
    data: PayloadType
