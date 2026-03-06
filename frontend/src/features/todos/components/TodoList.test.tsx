import { render, screen, within } from '@testing-library/react'
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

    const rows = screen.getAllByRole('listitem')
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
})
