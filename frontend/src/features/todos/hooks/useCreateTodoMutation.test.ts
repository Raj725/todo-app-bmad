import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { Todo } from '../types'
import { TODOS_QUERY_KEY } from './useTodosQuery'
import { useCreateTodoMutation } from './useCreateTodoMutation'

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)

  return { queryClient, wrapper }
}

const seedTodo = (overrides: Partial<Todo> = {}): Todo => ({
  id: 1,
  description: 'Existing task',
  isCompleted: false,
  createdAt: '2026-03-06T10:00:00.000Z',
  ...overrides,
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useCreateTodoMutation', () => {
  it('adds an optimistic todo row immediately while create is pending', async () => {
    vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise(() => undefined))

    const { wrapper, queryClient } = makeWrapper()
    queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, [seedTodo({ id: 20, description: 'Keep me' })])

    const { result } = renderHook(() => useCreateTodoMutation(), { wrapper })

    act(() => {
      result.current.mutate('New optimistic task')
    })

    await waitFor(() => {
      const todos = queryClient.getQueryData<Todo[]>(TODOS_QUERY_KEY) ?? []
      const optimisticTodo = todos.find((todo) => todo.description === 'New optimistic task')

      expect(optimisticTodo).toBeDefined()
      expect(optimisticTodo?.id).toBeLessThan(0)
    })
  })

  it('removes optimistic todo and exposes scoped create error on failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({
        error: {
          code: 'TODO_CREATE_FAILED',
          message: 'create failed',
          details: [],
          request_id: 'req-create-1',
        },
      }),
    } as Response)

    const { wrapper, queryClient } = makeWrapper()
    queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, [seedTodo({ id: 31, description: 'Stable task' })])

    const { result } = renderHook(() => useCreateTodoMutation(), { wrapper })

    act(() => {
      result.current.mutate('Will rollback')
    })

    await waitFor(() => {
      expect(result.current.createErrorMessage).toBe('create failed')
    })

    const todosAfterFailure = queryClient.getQueryData<Todo[]>(TODOS_QUERY_KEY) ?? []
    expect(todosAfterFailure.map((todo) => todo.description)).toEqual(['Stable task'])
    expect(todosAfterFailure.find((todo) => todo.description === 'Will rollback')).toBeUndefined()
  })
})
