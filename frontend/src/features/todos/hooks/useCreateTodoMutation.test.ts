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
  it('assigns unique optimistic ids for concurrent creates even if Date.now matches', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000)
    vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise(() => undefined))

    const { wrapper, queryClient } = makeWrapper()
    queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, [seedTodo({ id: 20, description: 'Existing task' })])

    const { result } = renderHook(() => useCreateTodoMutation(), { wrapper })

    act(() => {
      result.current.mutate('First optimistic task')
      result.current.mutate('Second optimistic task')
    })

    await waitFor(() => {
      const todos = queryClient.getQueryData<Todo[]>(TODOS_QUERY_KEY) ?? []
      const optimisticTodos = todos.filter((todo) => todo.id < 0)

      expect(optimisticTodos).toHaveLength(2)
      expect(new Set(optimisticTodos.map((todo) => todo.id)).size).toBe(2)
    })
  })

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

  it('does not append a duplicate created todo when cache already has authoritative item before onSuccess', async () => {
    let resolveResponse: (value: Response) => void
    const deferredResponse = new Promise<Response>((resolve) => {
      resolveResponse = resolve
    })

    vi.spyOn(globalThis, 'fetch').mockReturnValue(deferredResponse)

    const { wrapper, queryClient } = makeWrapper()
    queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, [seedTodo({ id: 1, description: 'Existing task' })])

    const { result } = renderHook(() => useCreateTodoMutation(), { wrapper })

    act(() => {
      result.current.mutate('Race created task')
    })

    await waitFor(() => {
      const todos = queryClient.getQueryData<Todo[]>(TODOS_QUERY_KEY) ?? []
      expect(todos.some((todo) => todo.description === 'Race created task')).toBe(true)
    })

    queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, [
      seedTodo({ id: 1, description: 'Existing task' }),
      seedTodo({ id: 999, description: 'Race created task' }),
    ])

    resolveResponse!({
      ok: true,
      status: 201,
      json: async () => ({
        data: {
          id: 999,
          description: 'Race created task',
          is_completed: false,
          created_at: '2026-03-06T10:00:00.000Z',
        },
      }),
    } as Response)

    await waitFor(() => {
      const todos = queryClient.getQueryData<Todo[]>(TODOS_QUERY_KEY) ?? []
      expect(todos.filter((todo) => todo.id === 999)).toHaveLength(1)
    })
  })

  it('clears create error and succeeds on retry without leaving stale optimistic rows', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          error: {
            code: 'TODO_CREATE_FAILED',
            message: 'create failed',
            details: [],
            request_id: 'req-create-retry-1',
          },
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          data: {
            id: 77,
            description: 'Retry created task',
            is_completed: false,
            created_at: '2026-03-06T10:00:00.000Z',
          },
        }),
      } as Response)

    const { wrapper, queryClient } = makeWrapper()
    queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, [seedTodo({ id: 31, description: 'Stable task' })])

    const { result } = renderHook(() => useCreateTodoMutation(), { wrapper })

    act(() => {
      result.current.mutate('Retry created task')
    })

    await waitFor(() => {
      expect(result.current.createErrorMessage).toBe('create failed')
    })

    act(() => {
      result.current.mutate('Retry created task')
    })

    await waitFor(() => {
      expect(result.current.createErrorMessage).toBeNull()
    })

    await waitFor(() => {
      const todos = queryClient.getQueryData<Todo[]>(TODOS_QUERY_KEY) ?? []
      expect(todos.filter((todo) => todo.description === 'Retry created task')).toHaveLength(1)
      expect(todos.find((todo) => todo.description === 'Retry created task')?.id).toBe(77)
    })
  })

  it('reconciles to authoritative backend list on settle even when todos query is inactive', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        data: {
          id: 500,
          description: 'Client optimistic create',
          is_completed: false,
          created_at: '2026-03-06T10:20:00.000Z',
        },
      }),
    } as Response)

    const authoritativeTodos: Todo[] = [
      seedTodo({ id: 601, description: 'Persisted backend task', createdAt: '2026-03-06T10:30:00.000Z' }),
    ]

    const { wrapper, queryClient } = makeWrapper()
    queryClient.setQueryDefaults(TODOS_QUERY_KEY, {
      queryFn: async () => authoritativeTodos,
    })
    queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, [seedTodo({ id: 1, description: 'Initial cache task' })])

    const { result } = renderHook(() => useCreateTodoMutation(), { wrapper })

    act(() => {
      result.current.mutate('Client optimistic create')
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    await waitFor(() => {
      expect(queryClient.getQueryData<Todo[]>(TODOS_QUERY_KEY)).toEqual(authoritativeTodos)
    })
  })
})
