import { useState } from 'react'
import type { Todo } from '../types'

type TodoListProps = {
  todos: Todo[]
  pendingTodoIds: Set<number>
  failedTodoId: number | null
  onToggleTodo: (todo: Todo) => void
  pendingDeleteIds: Set<number>
  failedDeleteTodoId: number | null
  onDeleteTodo: (todo: Todo) => void
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

export function TodoList({
  todos,
  pendingTodoIds,
  failedTodoId,
  onToggleTodo,
  pendingDeleteIds,
  failedDeleteTodoId,
  onDeleteTodo,
}: TodoListProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const sortedTodos = sortTodos(todos)

  return (
    <ul>
      {sortedTodos.map((todo) => {
        const isTogglePending = pendingTodoIds.has(todo.id)
        const isDeletePending = pendingDeleteIds.has(todo.id)
        // Disable all controls while either operation is in-flight
        const isAnyPending = isTogglePending || isDeletePending
        const isConfirmingDelete = confirmDeleteId === todo.id
        const hasDeleteError = failedDeleteTodoId === todo.id

        return (
          <li key={todo.id}>
            <p>
              {todo.description} {todo.isCompleted ? <strong>Completed</strong> : <strong>Active</strong>}
            </p>
            <p>Created: {formatCreatedAt(todo.createdAt)}</p>

            {/* Toggle button */}
            <button
              type="button"
              onClick={() => onToggleTodo(todo)}
              disabled={isAnyPending}
              aria-label={`Mark task "${todo.description}" as ${todo.isCompleted ? 'active' : 'complete'}`}
            >
              {isTogglePending
                ? 'Updating task...'
                : todo.isCompleted
                  ? 'Mark active'
                  : 'Mark complete'}
            </button>
            {failedTodoId === todo.id && <p role="alert">Unable to update task status.</p>}

            {/* Delete controls */}
            {isDeletePending ? (
              <button type="button" disabled aria-label={`Deleting task "${todo.description}"…`}>
                Deleting…
              </button>
            ) : isConfirmingDelete ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmDeleteId(null)
                    onDeleteTodo(todo)
                  }}
                  aria-label={`Confirm delete task "${todo.description}"`}
                >
                  Confirm?
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(null)}
                  aria-label={`Cancel delete task "${todo.description}"`}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDeleteId(todo.id)}
                disabled={isAnyPending}
                aria-label={`Delete task "${todo.description}"`}
              >
                Delete
              </button>
            )}

            {/* Scoped delete error with retry */}
            {hasDeleteError && !isDeletePending && (
              <p role="alert">
                Unable to delete task.{' '}
                <button
                  type="button"
                  onClick={() => onDeleteTodo(todo)}
                  aria-label={`Retry delete task "${todo.description}"`}
                >
                  Retry
                </button>
              </p>
            )}
          </li>
        )
      })}
    </ul>
  )
}
