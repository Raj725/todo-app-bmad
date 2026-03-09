import { useState } from 'react'
import { sortTodosByActionableOrder } from '../orderTodos'
import type { Todo } from '../types'

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

type TodoListProps = {
  todos: Todo[]
  pageSize?: number
  pageSizeOptions?: number[]
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
  pageSize = 25,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
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
  const [currentPageSize, setCurrentPageSize] = useState(Math.max(1, pageSize))
  const sortedTodos = sortTodosByActionableOrder(todos)
  const effectivePageSize = Math.max(1, currentPageSize)
  const totalPages = Math.max(1, Math.ceil(sortedTodos.length / effectivePageSize))
  const currentPageSafe = Math.min(currentPage, totalPages)
  const isPaginationVisible = sortedTodos.length > effectivePageSize
  const hasAnyRows = sortedTodos.length > 0
  const currentRangeStart = hasAnyRows ? (currentPageSafe - 1) * effectivePageSize + 1 : 0
  const currentRangeEnd = hasAnyRows
    ? Math.min(currentPageSafe * effectivePageSize, sortedTodos.length)
    : 0
  const normalizedPageSizeOptions = Array.from(
    new Set([...pageSizeOptions.filter((size) => size > 0), effectivePageSize]),
  ).sort((left, right) => left - right)

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

  const renderPaginationControls = (labelSuffix: string) => (
    <div className="todo-table-toolbar">
      <p className="todo-page-summary" aria-live="polite">
        Showing {currentRangeStart}-{currentRangeEnd} of {sortedTodos.length} tasks
      </p>
      <label className="todo-page-size" htmlFor={`todo-page-size-${labelSuffix}`}>
        Rows per page
      </label>
      <select
        id={`todo-page-size-${labelSuffix}`}
        className="todo-page-size-select"
        value={effectivePageSize}
        onChange={(event) => {
          setCurrentPageSize(Number(event.target.value))
          setCurrentPage(1)
        }}
      >
        {normalizedPageSizeOptions.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
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
    </div>
  )

  return (
    <>
      {hasAnyRows && renderPaginationControls('top')}
      <div className="todo-table-wrap">
        <table className="todo-table">
          <thead>
            <tr>
              <th scope="col" className="todo-col-id">#</th>
              <th scope="col">Task</th>
              <th scope="col">Status</th>
              <th scope="col">Created</th>
              <th scope="col" className="todo-col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
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
        const statusLabel = todo.isCompleted ? 'Completed' : 'Active'

          return (
            <tr key={todo.id} className="todo-row">
              <td className="todo-cell-id" data-label="ID">{todo.id > 0 ? todo.id : 'new'}</td>
              <td className="todo-cell-task" data-label="Task">
                {isEditing ? (
                  <div className="todo-edit-panel">
                    <label htmlFor={`edit-todo-${todo.id}`}>Edit task description</label>
                    <div className="todo-edit-controls">
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
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => saveEdit(todo)}
                        disabled={isUpdatePending}
                      >
                        {isUpdatePending ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-neutral"
                        onClick={cancelEditing}
                        disabled={isUpdatePending}
                      >
                        Cancel
                      </button>
                    </div>
                    {editValidationError && (
                      <p role="alert" className="todo-alert">
                        {editValidationError}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="todo-description" title={todo.description}>
                    {todo.description}
                  </p>
                )}
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
              </td>
              <td data-label="Status">
                <strong className={`todo-status ${todo.isCompleted ? 'todo-status-completed' : 'todo-status-active'}`}>
                  {statusLabel}
                </strong>
                {isOptimisticCreate ? <strong className="todo-status todo-status-pending">Pending</strong> : null}
              </td>
              <td className="todo-meta" data-label="Created">{todo.createdAt}</td>
              <td className="todo-actions" data-label="Actions">
                <button
                  type="button"
                  className="btn btn-icon btn-primary"
                  onClick={() => onToggleTodo(todo)}
                  disabled={isAnyPending}
                  aria-label={`Mark task "${todo.description}" as ${todo.isCompleted ? 'active' : 'complete'}`}
                  title={todo.isCompleted ? 'Mark active' : 'Mark complete'}
                >
                  {isUpdatePending ? (
                    <span aria-hidden="true">...</span>
                  ) : todo.isCompleted ? (
                    <svg aria-hidden="true" viewBox="0 0 24 24" className="todo-icon">
                      <path d="M4 12a8 8 0 1 0 3-6.2" fill="none" stroke="currentColor" strokeWidth="2" />
                      <path d="M4 4v4h4" fill="none" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  ) : (
                    <svg aria-hidden="true" viewBox="0 0 24 24" className="todo-icon">
                      <path d="m4 12 5 5 11-11" fill="none" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  )}
                </button>

                {!isEditing && (
                  <button
                    type="button"
                    className="btn btn-icon btn-neutral"
                    onClick={() => startEditing(todo)}
                    disabled={isAnyPending}
                    aria-label={`Edit task "${todo.description}"`}
                    title="Edit"
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24" className="todo-icon">
                      <path d="m4 20 4.5-1 9.8-9.8a1.5 1.5 0 0 0 0-2.1l-1.4-1.4a1.5 1.5 0 0 0-2.1 0L5 15.5 4 20z" fill="none" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </button>
                )}

                {isDeletePending ? (
                  <button
                    type="button"
                    className="btn btn-icon btn-danger"
                    disabled
                    aria-label={`Deleting task "${todo.description}"...`}
                    title="Deleting"
                  >
                    <span aria-hidden="true">...</span>
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
                      Confirm
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
                    className="btn btn-icon btn-danger"
                    onClick={() => setConfirmDeleteId(todo.id)}
                    disabled={isAnyPending}
                    aria-label={`Delete task "${todo.description}"`}
                    title="Delete"
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24" className="todo-icon">
                      <path d="M4 7h16" fill="none" stroke="currentColor" strokeWidth="2" />
                      <path d="M9 7V4h6v3" fill="none" stroke="currentColor" strokeWidth="2" />
                      <path d="M7 7v12h10V7" fill="none" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </button>
                )}
              </td>
            </tr>
          )
        })}
          </tbody>
        </table>
      </div>
      {isPaginationVisible && renderPaginationControls('bottom')}
    </>
  )
}
