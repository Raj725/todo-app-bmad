import type { Todo } from '../types'

type TodoListProps = {
  todos: Todo[]
}

const formatCreatedAt = (createdAt: string): string => {
  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) {
    return createdAt
  }
  return date.toISOString()
}

export function TodoList({ todos }: TodoListProps) {
  return (
    <ul>
      {todos.map((todo) => (
        <li key={todo.id}>
          <p>{todo.description}</p>
          <p>Created: {formatCreatedAt(todo.createdAt)}</p>
        </li>
      ))}
    </ul>
  )
}
