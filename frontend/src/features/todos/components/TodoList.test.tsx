import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { TodoList } from './TodoList'
import type { Todo } from '../types'

const noop = vi.fn()

const baseProps = {
  pendingTodoIds: new Set<number>(),
  failedToggleTodoIds: new Set<number>(),
  failedToggleErrorMessages: new Map<number, string>(),
  failedEditTodoIds: new Set<number>(),
  failedEditErrorMessages: new Map<number, string>(),
  onToggleTodo: noop,
  onEditTodo: noop,
  pendingDeleteIds: new Set<number>(),
  failedDeleteTodoIds: new Set<number>(),
  failedDeleteErrorMessages: new Map<number, string>(),
  onDeleteTodo: noop,
}

const todo = (overrides: Partial<Todo>): Todo => ({
  id: 1,
  description: 'Task',
  isCompleted: false,
  createdAt: '2026-03-06T10:00:00.000Z',
  ...overrides,
})

describe('TodoList', () => {
  it('renders active tasks before completed tasks with deterministic secondary sorting', () => {
    const todos: Todo[] = [
      todo({ id: 3, description: 'Completed newer', isCompleted: true, createdAt: '2026-03-06T12:00:00.000Z' }),
      todo({ id: 4, description: 'Active older', isCompleted: false, createdAt: '2026-03-06T08:00:00.000Z' }),
      todo({ id: 7, description: 'Active newest', isCompleted: false, createdAt: '2026-03-06T12:00:00.000Z' }),
      todo({ id: 6, description: 'Active same-time lower id', isCompleted: false, createdAt: '2026-03-06T11:00:00.000Z' }),
      todo({ id: 8, description: 'Active same-time higher id', isCompleted: false, createdAt: '2026-03-06T11:00:00.000Z' }),
      todo({ id: 2, description: 'Completed older', isCompleted: true, createdAt: '2026-03-06T07:00:00.000Z' }),
    ]

    render(<TodoList todos={todos} {...baseProps} />)

    const rows = screen.getAllByRole('row').slice(1)
    expect(within(rows[0]).getByText('Active newest')).toBeInTheDocument()
    expect(within(rows[1]).getByText('Active same-time higher id')).toBeInTheDocument()
    expect(within(rows[2]).getByText('Active same-time lower id')).toBeInTheDocument()
    expect(within(rows[3]).getByText('Active older')).toBeInTheDocument()
    expect(within(rows[4]).getByText('Completed newer')).toBeInTheDocument()
    expect(within(rows[5]).getByText('Completed older')).toBeInTheDocument()
  })

  it('shows explicit visible status labels for active and completed tasks', () => {
    render(
      <TodoList
        todos={[
          todo({ id: 10, description: 'Status active', isCompleted: false }),
          todo({ id: 11, description: 'Status completed', isCompleted: true }),
        ]}
        {...baseProps}
      />,
    )

    expect(screen.getByText('Status active')).toBeInTheDocument()
    expect(screen.getByText('Status completed')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Completed')).toBeInTheDocument()
  })

  it('shows a pending affordance for optimistic create rows', () => {
    render(
      <TodoList
        todos={[todo({ id: -99, description: 'Optimistic task', isCompleted: false })]}
        {...baseProps}
      />,
    )

    expect(screen.getByText('Optimistic task')).toBeInTheDocument()
    expect(screen.getByText('Pending')).toBeInTheDocument()
  })

  it('shows scoped toggle retry control with explicit accessible label when toggle fails', () => {
    const onToggleTodo = vi.fn()
    render(
      <TodoList
        todos={[todo({ id: 44, description: 'Toggle retry item', isCompleted: false })]}
        {...baseProps}
        onToggleTodo={onToggleTodo}
        failedToggleTodoIds={new Set([44])}
        failedToggleErrorMessages={new Map([[44, 'Toggle failed for selected task.']])}
      />,
    )

    expect(screen.getByText('Toggle failed for selected task.')).toBeInTheDocument()
    const retryButton = screen.getByRole('button', { name: 'Retry toggle task "Toggle retry item"' })
    expect(retryButton).toBeVisible()
    fireEvent.click(retryButton)
    expect(onToggleTodo).toHaveBeenCalledWith(expect.objectContaining({ id: 44, description: 'Toggle retry item' }))
  })

  it('keeps unrelated task actions usable when another task has a toggle failure', () => {
    render(
      <TodoList
        todos={[
          todo({ id: 51, description: 'Failed toggle task', isCompleted: false }),
          todo({ id: 52, description: 'Unaffected task', isCompleted: false }),
        ]}
        {...baseProps}
        failedToggleTodoIds={new Set([51])}
        failedToggleErrorMessages={new Map([[51, 'Toggle failed for first task.']])}
      />,
    )

    expect(screen.getByText('Toggle failed for first task.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry toggle task "Failed toggle task"' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Mark task "Unaffected task" as complete' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Edit task "Unaffected task"' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Delete task "Unaffected task"' })).toBeEnabled()
  })

  it('quick-add failure isolation: TodoList row actions remain enabled with no pending or failed state (component boundary contract)', () => {
    // TodoList receives no createTodo-related props — isolation is enforced by the component boundary.
    // This test documents that contract: with all pending/failed sets empty all row controls are enabled.
    render(
      <TodoList
        todos={[todo({ id: 99, description: 'Any task', isCompleted: false })]}
        {...baseProps}
      />,
    )

    expect(screen.getByRole('button', { name: 'Mark task "Any task" as complete' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Edit task "Any task"' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Delete task "Any task"' })).toBeEnabled()
  })

  it('shows scoped edit retry control and dispatches retry call when edit fails after a prior save attempt', () => {
    const onEditTodo = vi.fn()
    const { rerender } = render(
      <TodoList
        todos={[todo({ id: 55, description: 'Edit retry item', isCompleted: false })]}
        {...baseProps}
        onEditTodo={onEditTodo}
      />,
    )

    // Enter edit mode, type a new description, and save — sets lastSubmittedEdits[55]
    fireEvent.click(screen.getByRole('button', { name: 'Edit task "Edit retry item"' }))
    fireEvent.change(screen.getByLabelText('Edit description for task "Edit retry item"'), {
      target: { value: 'Updated description' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onEditTodo).toHaveBeenCalledWith(expect.objectContaining({ id: 55 }), 'Updated description')

    // Simulate the mutation reporting failure via updated props
    rerender(
      <TodoList
        todos={[todo({ id: 55, description: 'Edit retry item', isCompleted: false })]}
        {...baseProps}
        onEditTodo={onEditTodo}
        failedEditTodoIds={new Set([55])}
        failedEditErrorMessages={new Map([[55, 'Edit failed.']])}
      />,
    )

    const retryButton = screen.getByRole('button', { name: 'Retry edit task "Edit retry item"' })
    expect(retryButton).toBeVisible()
    fireEvent.click(retryButton)
    expect(onEditTodo).toHaveBeenLastCalledWith(expect.objectContaining({ id: 55 }), 'Updated description')
  })

  it('paginates sorted rows and exposes page indicators with next/previous controls', () => {
    const todos: Todo[] = [
      todo({ id: 1, description: 'Task 1', createdAt: '2026-03-06T15:00:01.000Z' }),
      todo({ id: 2, description: 'Task 2', createdAt: '2026-03-06T15:00:02.000Z' }),
      todo({ id: 3, description: 'Task 3', createdAt: '2026-03-06T15:00:03.000Z' }),
      todo({ id: 4, description: 'Task 4', createdAt: '2026-03-06T15:00:04.000Z' }),
      todo({ id: 5, description: 'Task 5', createdAt: '2026-03-06T15:00:05.000Z' }),
      todo({ id: 6, description: 'Task 6', createdAt: '2026-03-06T15:00:06.000Z' }),
      todo({ id: 7, description: 'Task 7', createdAt: '2026-03-06T15:00:07.000Z' }),
    ]

    render(<TodoList todos={todos} pageSize={3} {...baseProps} />)

    expect(screen.getAllByText('Page 1 of 3').length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: 'Previous page' })[0]).toBeDisabled()
    expect(screen.getAllByRole('button', { name: 'Next page' })[0]).toBeEnabled()

    expect(screen.getByText('Task 7')).toBeInTheDocument()
    expect(screen.getByText('Task 6')).toBeInTheDocument()
    expect(screen.getByText('Task 5')).toBeInTheDocument()
    expect(screen.queryByText('Task 4')).not.toBeInTheDocument()

    fireEvent.click(screen.getAllByRole('button', { name: 'Next page' })[0])

    expect(screen.getAllByText('Page 2 of 3').length).toBeGreaterThan(0)
    expect(screen.getByText('Task 4')).toBeInTheDocument()
    expect(screen.getByText('Task 3')).toBeInTheDocument()
    expect(screen.getByText('Task 2')).toBeInTheDocument()
  })

  it('keeps actionable ordering deterministic within paginated results', () => {
    const todos: Todo[] = [
      todo({ id: 1, description: 'Active newest', isCompleted: false, createdAt: '2026-03-06T20:00:00.000Z' }),
      todo({ id: 2, description: 'Completed newest', isCompleted: true, createdAt: '2026-03-06T21:00:00.000Z' }),
      todo({ id: 3, description: 'Active older', isCompleted: false, createdAt: '2026-03-06T19:00:00.000Z' }),
      todo({ id: 4, description: 'Completed older', isCompleted: true, createdAt: '2026-03-06T18:00:00.000Z' }),
    ]

    render(<TodoList todos={todos} pageSize={2} {...baseProps} />)

    const pageOneRows = screen.getAllByRole('row').slice(1)
    expect(within(pageOneRows[0]).getByText('Active newest')).toBeInTheDocument()
    expect(within(pageOneRows[1]).getByText('Active older')).toBeInTheDocument()

    fireEvent.click(screen.getAllByRole('button', { name: 'Next page' })[0])

    const pageTwoRows = screen.getAllByRole('row').slice(1)
    expect(within(pageTwoRows[0]).getByText('Completed newest')).toBeInTheDocument()
    expect(within(pageTwoRows[1]).getByText('Completed older')).toBeInTheDocument()
  })
})
