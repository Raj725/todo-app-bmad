import { useState } from 'react'
import type { Todo } from '../types'

type TodoListProps = {
  todos: Todo[]
  pendingTodoIds: Set<number>
  failedTodoId: number | null
  failedEditTodoIds: Set<number>
  onToggleTodo: (todo: Todo) => void
  onEditTodo: (todo: Todo, description: string) => void
  pendingDeleteIds: Set<number>
  failedDeleteTodoIds: Set<number>
  onDeleteTodo: (todo: Todo) => void
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
  failedEditTodoIds,
  onToggleTodo,
  onEditTodo,
  pendingDeleteIds,
  failedDeleteTodoIds,
  onDeleteTodo,
}: TodoListProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [editTodoId, setEditTodoId] = useState<number | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [editValidationError, setEditValidationError] = useState<string | null>(null)
  const [lastSubmittedEdits, setLastSubmittedEdits] = useState<Record<number, string>>({})
  const sortedTodos = sortTodos(todos)

  const startEditing = (todo: Todo) => {
    setEditTodoId(todo.id)
    setEditDraft(todo.description)
    setEditValidationError(null)
  }

  const cancelEditing = () => {
    setEditTodoId(null)
    setEditDraft('')
    setEditValidationError(null)
  }

  const saveEdit = (todo: Todo) => {
    const nextDescription = editDraft.trim()
    if (!nextDescription) {
      setEditValidationError('Task description is required.')
      return
    }

    setLastSubmittedEdits((current) => ({ ...current, [todo.id]: nextDescription }))
    setEditValidationError(null)
    setEditTodoId(null)
    onEditTodo(todo, nextDescription)
  }

  return (
    <ul>
      {sortedTodos.map((todo) => {
        const isTogglePending = pendingTodoIds.has(todo.id)
        const isEditPending = pendingTodoIds.has(todo.id)
        const isDeletePending = pendingDeleteIds.has(todo.id)
        // Disable all controls while either operation is in-flight
        const isAnyPending = isTogglePending || isEditPending || isDeletePending
        const isConfirmingDelete = confirmDeleteId === todo.id
        const hasDeleteError = failedDeleteTodoIds.has(todo.id)
        const hasEditError = failedEditTodoIds.has(todo.id)
        const isEditing = editTodoId === todo.id
        const canRetryEdit = Boolean(lastSubmittedEdits[todo.id])

        return (
          <li key={todo.id}>
            {isEditing ? (
              <>
                <label htmlFor={`edit-todo-${todo.id}`}>Edit task description</label>
                <input
                  id={`edit-todo-${todo.id}`}
                  value={editDraft}
                  onChange={(event) => {
                    setEditDraft(event.target.value)
                    if (editValidationError) {
                      setEditValidationError(null)
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      saveEdit(todo)
                    }
                    if (event.key === 'Escape') {
                      event.preventDefault()
                      cancelEditing()
                    }
                  }}
                  aria-label={`Edit description for task "${todo.description}"`}
                  disabled={isEditPending}
                />
                <button type="button" onClick={() => saveEdit(todo)} disabled={isEditPending}>
                  {isEditPending ? 'Saving…' : 'Save'}
                </button>
                <button type="button" onClick={cancelEditing} disabled={isEditPending}>
                  Cancel
                </button>
                {editValidationError && <p role="alert">{editValidationError}</p>}
              </>
            ) : (
              <p>
                {todo.description} {todo.isCompleted ? <strong>Completed</strong> : <strong>Active</strong>}
              </p>
            )}
            <p>Created: {todo.createdAt}</p>

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

            {!isEditing && (
              <button
                type="button"
                onClick={() => startEditing(todo)}
                disabled={isAnyPending}
                aria-label={`Edit task "${todo.description}"`}
              >
                Edit
              </button>
            )}

            {hasEditError && !isEditPending && canRetryEdit && (
              <p role="alert">
                Unable to update task description.{' '}
                <button
                  type="button"
                  onClick={() => onEditTodo(todo, lastSubmittedEdits[todo.id])}
                  aria-label={`Retry edit task "${todo.description}"`}
                >
                  Retry
                </button>
              </p>
            )}

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
