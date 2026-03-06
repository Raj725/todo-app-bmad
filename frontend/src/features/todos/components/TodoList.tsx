import type { Todo } from '../types'

type TodoListProps = {
  todos: Todo[]
  pendingTodoIds: Set<number>
  failedTodoId: number | null
  onToggleTodo: (todo: Todo) => void
}

const formatCreatedAt = (createdAt: string): string => {
  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) {
    return createdAt
  }
  return createdAt
}

const sortTodos = (todos: Todo[]): Todo[] => {
  return [...todos].sort((left, right) => {
    if (left.isCompleted !== right.isCompleted) {
      return left.isCompleted ? 1 : -1
    }

    const createdAtDiff = new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    if (!Number.isNaN(createdAtDiff) && createdAtDiff !== 0) {
      return createdAtDiff
    }

    return right.id - left.id
  })
}

export function TodoList({ todos, pendingTodoIds, failedTodoId, onToggleTodo }: TodoListProps) {
  const sortedTodos = sortTodos(todos)

  return (
    <ul>
      {sortedTodos.map((todo) => (
        <li key={todo.id}>
          <p>
            {todo.description} {todo.isCompleted ? <strong>Completed</strong> : <strong>Active</strong>}
          </p>
          <p>Created: {formatCreatedAt(todo.createdAt)}</p>
          <button
            type="button"
            onClick={() => onToggleTodo(todo)}
            disabled={pendingTodoIds.has(todo.id)}
            aria-label={`Mark task "${todo.description}" as ${todo.isCompleted ? 'active' : 'complete'}`}
          >
            {pendingTodoIds.has(todo.id)
              ? 'Updating task...'
              : todo.isCompleted
                ? 'Mark active'
                : 'Mark complete'}
          </button>
          {failedTodoId === todo.id && <p role="alert">Unable to update task status.</p>}
        </li>
      ))}
    </ul>
  )
}
