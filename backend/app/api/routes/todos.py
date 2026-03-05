from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.schemas.response import SuccessResponse
from app.db.session import get_session
from app.repositories.todo_repository import TodoRepository
from app.schemas.todo import TodoCreateRequest, TodoResponse
from app.services.todo_service import TodoService

router = APIRouter(prefix="/todos", tags=["todos"])


@router.post("", response_model=SuccessResponse[TodoResponse], status_code=status.HTTP_201_CREATED)
def create_todo(payload: TodoCreateRequest, session: Session = Depends(get_session)) -> SuccessResponse[TodoResponse]:
    repository = TodoRepository(session)
    service = TodoService(repository)
    todo = service.create_todo(description=payload.description)
    return SuccessResponse(data=TodoResponse.model_validate(todo))
