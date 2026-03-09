import { useState } from 'react'
import { sortTodosByActionableOrder } from '../orderTodos'
import type { Todo } from '../types'

type TodoListProps = {
  todos: Todo[]
  pageSize?: number
  pendingTodoIds: Set<number>
  failedToggleTodoIds: Set<number>
  failedToggleErrorMessages: Map<number, string>
  failedEditTodoIds: Set<number>
  failedEditErrorMessages: Map<number, string>
  onToggleTodo: (todo: Todo) => void
  onEditTodo: (todo: Todo, description: string) => void
  pendingDeleteIds: Set<number>
  failedDeleteTodoIds: Set<number>
  failedDeleteErrorMessages: Map<number, string>
  onDeleteTodo: (todo: Todo) => void
}

export function TodoList({
  todos,
  pageSize = 10,
  pendingTodoIds,
  failedToggleTodoIds,
  failedToggleErrorMessages,
  failedEditTodoIds,
  failedEditErrorMessages,
  onToggleTodo,
  onEditTodo,
  pendingDeleteIds,
  failedDeleteTodoIds,
  failedDeleteErrorMessages,
  onDeleteTodo,
}: TodoListProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [editTodoId, setEditTodoId] = useState<number | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [editValidationError, setEditValidationError] = useState<string | null>(null)
  const [lastSubmittedEdits, setLastSubmittedEdits] = useState<Record<number, string>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const sortedTodos = sortTodosByActionableOrder(todos)
  const effectivePageSize = Math.max(1, pageSize)
  const totalPages = Math.max(1, Math.ceil(sortedTodos.length / effectivePageSize))
  const currentPageSafe = Math.min(currentPage, totalPages)
  const isPaginationVisible = sortedTodos.length > effectivePageSize

  const currentOffset = (currentPageSafe - 1) * effectivePageSize
  const visibleTodos = sortedTodos.slice(currentOffset, currentOffset + effectivePageSize)

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
    <>
      <ul className="todo-list">
        {visibleTodos.map((todo) => {
        const isOptimisticCreate = todo.id < 0
        const isUpdatePending = pendingTodoIds.has(todo.id)
        const isDeletePending = pendingDeleteIds.has(todo.id)
        // Disable all controls while either operation is in-flight
        const isAnyPending = isUpdatePending || isDeletePending
        const isConfirmingDelete = confirmDeleteId === todo.id
        const hasDeleteError = failedDeleteTodoIds.has(todo.id)
        const hasEditError = failedEditTodoIds.has(todo.id)
        const isEditing = editTodoId === todo.id
        const canRetryEdit = Boolean(lastSubmittedEdits[todo.id])
        const hasToggleError = failedToggleTodoIds.has(todo.id)
        const toggleErrorMessage = failedToggleErrorMessages.get(todo.id) ?? 'Unable to update task status.'
        const editErrorMessage =
          failedEditErrorMessages.get(todo.id) ?? 'Unable to update task description.'
        const deleteErrorMessage = failedDeleteErrorMessages.get(todo.id) ?? 'Unable to delete task.'

          return (
            <li key={todo.id} className="todo-row">
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
                  disabled={isUpdatePending}
                />
                <button type="button" className="btn btn-primary" onClick={() => saveEdit(todo)} disabled={isUpdatePending}>
                  {isUpdatePending ? 'Saving…' : 'Save'}
                </button>
                <button type="button" className="btn btn-neutral" onClick={cancelEditing} disabled={isUpdatePending}>
                  Cancel
                </button>
                {editValidationError && <p role="alert" className="todo-alert">{editValidationError}</p>}
              </>
            ) : (
              <p className="todo-description">
                {todo.description}{' '}
                {todo.isCompleted ? (
                  <strong className="todo-status todo-status-completed">Completed</strong>
                ) : (
                  <strong className="todo-status todo-status-active">Active</strong>
                )}
                {isOptimisticCreate ? <strong className="todo-status todo-status-pending"> Pending</strong> : null}
              </p>
            )}
            <p className="todo-meta">Created: {todo.createdAt}</p>

            {/* Toggle button */}
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onToggleTodo(todo)}
              disabled={isAnyPending}
              aria-label={`Mark task "${todo.description}" as ${todo.isCompleted ? 'active' : 'complete'}`}
            >
              {isUpdatePending
                ? 'Updating task...'
                : todo.isCompleted
                  ? 'Mark active'
                  : 'Mark complete'}
            </button>
            {hasToggleError && !isUpdatePending && (
              <p role="alert" className="todo-alert">
                {toggleErrorMessage}{' '}
                <button
                  type="button"
                  className="btn btn-neutral"
                  onClick={() => onToggleTodo(todo)}
                  aria-label={`Retry toggle task "${todo.description}"`}
                >
                  Retry
                </button>
              </p>
            )}

            {!isEditing && (
              <button
                type="button"
                className="btn btn-neutral"
                onClick={() => startEditing(todo)}
                disabled={isAnyPending}
                aria-label={`Edit task "${todo.description}"`}
              >
                Edit
              </button>
            )}

            {hasEditError && !isUpdatePending && canRetryEdit && (
              <p role="alert" className="todo-alert">
                {editErrorMessage}{' '}
                <button
                  type="button"
                  className="btn btn-neutral"
                  onClick={() => onEditTodo(todo, lastSubmittedEdits[todo.id])}
                  aria-label={`Retry edit task "${todo.description}"`}
                >
                  Retry
                </button>
              </p>
            )}

            {/* Delete controls */}
            {isDeletePending ? (
              <button type="button" className="btn btn-danger" disabled aria-label={`Deleting task "${todo.description}"…`}>
                Deleting…
              </button>
            ) : isConfirmingDelete ? (
              <>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => {
                    setConfirmDeleteId(null)
                    onDeleteTodo(todo)
                  }}
                  aria-label={`Confirm delete task "${todo.description}"`}
                  disabled={isAnyPending}
                >
                  Confirm?
                </button>
                <button
                  type="button"
                  className="btn btn-neutral"
                  onClick={() => setConfirmDeleteId(null)}
                  aria-label={`Cancel delete task "${todo.description}"`}
                  disabled={isAnyPending}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => setConfirmDeleteId(todo.id)}
                disabled={isAnyPending}
                aria-label={`Delete task "${todo.description}"`}
              >
                Delete
              </button>
            )}

            {/* Scoped delete error with retry */}
            {hasDeleteError && !isDeletePending && (
              <p role="alert" className="todo-alert">
                {deleteErrorMessage}{' '}
                <button
                  type="button"
                  className="btn btn-neutral"
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

      {isPaginationVisible && (
        <nav className="todo-pagination" aria-label="Task list pagination">
          <button
            type="button"
            className="btn btn-neutral"
            onClick={() => setCurrentPage((previous) => Math.max(1, previous - 1))}
            disabled={currentPageSafe === 1}
            aria-label="Previous page"
          >
            Previous
          </button>
          <p className="todo-page-indicator" aria-live="polite">
            Page {currentPageSafe} of {totalPages}
          </p>
          <button
            type="button"
            className="btn btn-neutral"
            onClick={() => setCurrentPage((previous) => Math.min(totalPages, previous + 1))}
            disabled={currentPageSafe === totalPages}
            aria-label="Next page"
          >
            Next
          </button>
        </nav>
      )}
    </>
  )
}
