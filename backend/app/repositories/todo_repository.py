from sqlalchemy.orm import Session

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
