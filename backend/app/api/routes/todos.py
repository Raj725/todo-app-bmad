from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.schemas.response import SuccessResponse
from app.db.session import get_session
from app.repositories.todo_repository import TodoRepository
from app.schemas.todo import TodoCreateRequest, TodoResponse, TodoUpdateRequest
from app.services.todo_service import TodoService

router = APIRouter(prefix="/todos", tags=["todos"])


@router.post("", response_model=SuccessResponse[TodoResponse], status_code=status.HTTP_201_CREATED)
def create_todo(payload: TodoCreateRequest, session: Session = Depends(get_session)) -> SuccessResponse[TodoResponse]:
    repository = TodoRepository(session)
    service = TodoService(repository)
    todo = service.create_todo(description=payload.description)
    return SuccessResponse(data=TodoResponse.model_validate(todo))


@router.get("", response_model=SuccessResponse[list[TodoResponse]], status_code=status.HTTP_200_OK)
def list_todos(session: Session = Depends(get_session)) -> SuccessResponse[list[TodoResponse]]:
    repository = TodoRepository(session)
    service = TodoService(repository)
    todos = service.list_todos()
    return SuccessResponse(data=[TodoResponse.model_validate(todo) for todo in todos])


@router.patch("/{todo_id}", response_model=SuccessResponse[TodoResponse], status_code=status.HTTP_200_OK)
def update_todo(
    todo_id: int,
    payload: TodoUpdateRequest,
    session: Session = Depends(get_session),
) -> SuccessResponse[TodoResponse]:
    repository = TodoRepository(session)
    service = TodoService(repository)
    todo = service.update_todo(todo_id=todo_id, is_completed=payload.is_completed, description=payload.description)
    return SuccessResponse(data=TodoResponse.model_validate(todo))


@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_todo(
    todo_id: int,
    session: Session = Depends(get_session),
) -> None:
    repository = TodoRepository(session)
    service = TodoService(repository)
    service.delete_todo(todo_id=todo_id)
