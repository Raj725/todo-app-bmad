from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.models.todo import Todo


class TodoRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def create(self, description: str) -> Todo:
        todo = Todo(description=description, is_completed=False)
        self.session.add(todo)
        self.session.commit()
        self.session.refresh(todo)
        return todo

    def list(self) -> list[Todo]:
        query = self.session.query(Todo).order_by(desc(Todo.created_at), desc(Todo.id))
        return list(query.all())
