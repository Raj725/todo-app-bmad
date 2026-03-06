from app.db.models.todo import Todo
from app.repositories.todo_repository import TodoRepository


class TodoNotFoundError(Exception):
    def __init__(self, todo_id: int) -> None:
        super().__init__(f"Todo with id {todo_id} not found")
        self.todo_id = todo_id


class TodoService:
    def __init__(self, repository: TodoRepository) -> None:
        self.repository = repository

    def create_todo(self, description: str) -> Todo:
        return self.repository.create(description=description)

    def list_todos(self) -> list[Todo]:
        return self.repository.list()

    def update_todo_is_completed(self, todo_id: int, is_completed: bool) -> Todo:
        updated_todo = self.repository.update_is_completed(todo_id=todo_id, is_completed=is_completed)
        if updated_todo is None:
            raise TodoNotFoundError(todo_id)
        return updated_todo
