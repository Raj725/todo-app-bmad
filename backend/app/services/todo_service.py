from app.db.models.todo import Todo
from app.repositories.todo_repository import TodoRepository


class TodoService:
    def __init__(self, repository: TodoRepository) -> None:
        self.repository = repository

    def create_todo(self, description: str) -> Todo:
        return self.repository.create(description=description)
