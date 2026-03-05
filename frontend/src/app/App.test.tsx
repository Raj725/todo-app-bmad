import { render, screen } from '@testing-library/react'
import type { Mock } from 'vitest'
import { vi } from 'vitest'

import App from './App'
import { useTodosQuery } from '../features/todos/hooks/useTodosQuery'

vi.mock('../features/todos/hooks/useTodosQuery', () => ({
  useTodosQuery: vi.fn(),
}))

describe('Task list states', () => {
  const useTodosQueryMock = useTodosQuery as Mock

  it('renders explicit loading state while list query is pending', () => {
    useTodosQueryMock.mockReturnValue({
      isPending: true,
      isError: false,
      data: undefined,
    })

    render(<App />)

    expect(screen.getByRole('heading', { name: 'Todo App' })).toBeInTheDocument()
    expect(screen.getByText('Loading tasks...')).toBeInTheDocument()
  })

  it('renders explicit empty state and keeps quick-add visible', () => {
    useTodosQueryMock.mockReturnValue({
      isPending: false,
      isError: false,
      data: [],
    })

    render(<App />)

    expect(screen.getByText('No tasks yet.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Quick add task' })).toBeInTheDocument()
  })

  it('renders populated list with deterministic created timestamp', () => {
    useTodosQueryMock.mockReturnValue({
      isPending: false,
      isError: false,
      data: [
        {
          id: 2,
          description: 'Second task',
          isCompleted: false,
          createdAt: '2026-03-05T10:15:30.000Z',
        },
      ],
    })

    render(<App />)

    expect(screen.getByText('Second task')).toBeInTheDocument()
    expect(screen.getByText('Created: 2026-03-05T10:15:30.000Z')).toBeInTheDocument()
  })
})
