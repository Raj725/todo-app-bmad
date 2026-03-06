import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { Todo } from '../types'
import { TODOS_QUERY_KEY } from './useTodosQuery'
import { useUpdateTodoMutation } from './useUpdateTodoMutation'

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
  description: 'Test task',
  isCompleted: false,
  createdAt: '2026-03-06T10:00:00.000Z',
  ...overrides,
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useUpdateTodoMutation', () => {
  it('exposes empty pendingTodoIds and failedToggleTodoIds Sets on initial render', () => {
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useUpdateTodoMutation(), { wrapper })

    expect(result.current.pendingTodoIds).toEqual(new Set())
    expect(result.current.failedToggleTodoIds).toEqual(new Set())
  })

  it('adds todoId to pendingTodoIds while mutation is in-flight and removes it on successful settle', async () => {
    let resolveResponse: (value: Response) => void
    const deferredResponse = new Promise<Response>((resolve) => {
      resolveResponse = resolve
    })

    vi.spyOn(globalThis, 'fetch').mockReturnValue(deferredResponse)

    const todo = seedTodo({ id: 5 })
    const { wrapper, queryClient } = makeWrapper()
    queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, [todo])

    const { result } = renderHook(() => useUpdateTodoMutation(), { wrapper })

    act(() => {
      result.current.mutate({ todoId: 5, isCompleted: true })
    })

    await waitFor(() => {
      expect(result.current.pendingTodoIds.has(5)).toBe(true)
    })

    resolveResponse!({
      ok: true,
      json: async () => ({
        data: {
          id: 5,
          description: 'Test task',
          is_completed: true,
          created_at: '2026-03-06T10:00:00.000Z',
        },
      }),
    } as Response)

    await waitFor(() => {
      expect(result.current.pendingTodoIds.has(5)).toBe(false)
    })
  })

  it('tracks failed toggle id and rolls back the optimistic update when the PATCH fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: { message: 'server error' } }),
    } as Response)

    const todo = seedTodo({ id: 7, isCompleted: false })
    const { wrapper, queryClient } = makeWrapper()
    queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, [todo])

    const { result } = renderHook(() => useUpdateTodoMutation(), { wrapper })

    act(() => {
      result.current.mutate({ todoId: 7, isCompleted: true })
    })

    await waitFor(() => {
      expect(result.current.failedToggleTodoIds.has(7)).toBe(true)
    })

    const todos = queryClient.getQueryData<Todo[]>(TODOS_QUERY_KEY)
    expect(todos?.find((t) => t.id === 7)?.isCompleted).toBe(false)
    expect(result.current.pendingTodoIds.has(7)).toBe(false)
  })

  it('tracks multiple concurrent todoIds in pendingTodoIds independently', async () => {
    const deferred5 = new Promise<Response>(() => undefined)
    const deferred9 = new Promise<Response>(() => undefined)

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      if (String(input).endsWith('/todos/5')) return deferred5
      return deferred9
    })

    const todos: Todo[] = [
      seedTodo({ id: 5, description: 'Task A' }),
      seedTodo({ id: 9, description: 'Task B' }),
    ]
    const { wrapper, queryClient } = makeWrapper()
    queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, todos)

    const { result } = renderHook(() => useUpdateTodoMutation(), { wrapper })

    act(() => {
      result.current.mutate({ todoId: 5, isCompleted: true })
    })

    act(() => {
      result.current.mutate({ todoId: 9, isCompleted: true })
    })

    await waitFor(() => {
      expect(result.current.pendingTodoIds.has(5)).toBe(true)
      expect(result.current.pendingTodoIds.has(9)).toBe(true)
    })
  })

  it('clears failed toggle id on the next successful mutation for the same todo', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: { message: 'server error' } }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            id: 3,
            description: 'Recovery task',
            is_completed: true,
            created_at: '2026-03-06T10:00:00.000Z',
          },
        }),
      } as Response)

    const todo = seedTodo({ id: 3, description: 'Recovery task' })
    const { wrapper, queryClient } = makeWrapper()
    queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, [todo])

    const { result } = renderHook(() => useUpdateTodoMutation(), { wrapper })

    act(() => {
      result.current.mutate({ todoId: 3, isCompleted: true })
    })

    await waitFor(() => {
      expect(result.current.failedToggleTodoIds.has(3)).toBe(true)
    })

    act(() => {
      result.current.mutate({ todoId: 3, isCompleted: true })
    })

    await waitFor(() => {
      expect(result.current.failedToggleTodoIds.has(3)).toBe(false)
    })
  })

  it('maintains actionable ordering after failed optimistic toggle rollback', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: { message: 'server error' } }),
    } as Response)

    const { wrapper, queryClient } = makeWrapper()
    queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, [
      seedTodo({ id: 91, description: 'Newest active', isCompleted: false, createdAt: '2026-03-06T10:00:00.000Z' }),
      seedTodo({ id: 92, description: 'Older active', isCompleted: false, createdAt: '2026-03-06T09:00:00.000Z' }),
      seedTodo({ id: 93, description: 'Completed', isCompleted: true, createdAt: '2026-03-06T08:00:00.000Z' }),
    ])

    const { result } = renderHook(() => useUpdateTodoMutation(), { wrapper })

    act(() => {
      result.current.mutate({ todoId: 91, isCompleted: true })
    })

    await waitFor(() => {
      expect(result.current.failedToggleTodoIds.has(91)).toBe(true)
    })

    const rolledBackTodos = queryClient.getQueryData<Todo[]>(TODOS_QUERY_KEY) ?? []
    expect(rolledBackTodos.map((todo) => todo.id)).toEqual([91, 92, 93])
  })

  it('tracks concurrent failed toggles independently', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: { message: 'server error' } }),
    } as Response)

    const { wrapper, queryClient } = makeWrapper()
    queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, [
      seedTodo({ id: 101, description: 'Task 101' }),
      seedTodo({ id: 102, description: 'Task 102' }),
    ])

    const { result } = renderHook(() => useUpdateTodoMutation(), { wrapper })

    act(() => {
      result.current.mutate({ todoId: 101, isCompleted: true })
      result.current.mutate({ todoId: 102, isCompleted: true })
    })

    await waitFor(() => {
      expect(result.current.failedToggleTodoIds.has(101)).toBe(true)
      expect(result.current.failedToggleTodoIds.has(102)).toBe(true)
    })
  })

  it('optimistically updates description and rolls back only failed item on error', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input)

      if (url.endsWith('/todos/7') && init?.method === 'PATCH') {
        return {
          ok: false,
          status: 500,
          json: async () => ({ error: { message: 'server error' } }),
        } as Response
      }

      return {
        ok: true,
        json: async () => ({
          data: {
            id: 8,
            description: 'Second task',
            is_completed: false,
            created_at: '2026-03-06T10:00:00.000Z',
          },
        }),
      } as Response
    })

    const todos: Todo[] = [
      seedTodo({ id: 7, description: 'Original first task' }),
      seedTodo({ id: 8, description: 'Second task' }),
    ]

    const { wrapper, queryClient } = makeWrapper()
    queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, todos)

    const { result } = renderHook(() => useUpdateTodoMutation(), { wrapper })

    act(() => {
      result.current.mutate({ todoId: 7, description: 'Edited first task' })
    })

    await waitFor(() => {
      expect(result.current.failedDescriptionTodoIds.has(7)).toBe(true)
    })

    const nextTodos = queryClient.getQueryData<Todo[]>(TODOS_QUERY_KEY) ?? []
    expect(nextTodos.find((todo) => todo.id === 7)?.description).toBe('Original first task')
    expect(nextTodos.find((todo) => todo.id === 8)?.description).toBe('Second task')
  })

  it('clears failedDescriptionTodoIds entry on successful retry of description update', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: { message: 'server error' } }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            id: 14,
            description: 'Edited task',
            is_completed: false,
            created_at: '2026-03-06T10:00:00.000Z',
          },
        }),
      } as Response)

    const { wrapper, queryClient } = makeWrapper()
    queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, [seedTodo({ id: 14, description: 'Original task' })])

    const { result } = renderHook(() => useUpdateTodoMutation(), { wrapper })

    act(() => {
      result.current.mutate({ todoId: 14, description: 'Edited task' })
    })

    await waitFor(() => {
      expect(result.current.failedDescriptionTodoIds.has(14)).toBe(true)
    })

    act(() => {
      result.current.mutate({ todoId: 14, description: 'Edited task' })
    })

    await waitFor(() => {
      expect(result.current.failedDescriptionTodoIds.has(14)).toBe(false)
    })
  })

  it('reorders cached todos immediately on optimistic toggle using active-first policy', async () => {
    const deferredResponse = new Promise<Response>(() => undefined)

    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => deferredResponse)

    const { wrapper, queryClient } = makeWrapper()
    queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, [
      seedTodo({ id: 21, description: 'Will complete', isCompleted: false, createdAt: '2026-03-06T10:00:00.000Z' }),
      seedTodo({ id: 20, description: 'Older active', isCompleted: false, createdAt: '2026-03-06T08:00:00.000Z' }),
      seedTodo({ id: 22, description: 'Existing completed', isCompleted: true, createdAt: '2026-03-06T09:00:00.000Z' }),
    ])

    const { result } = renderHook(() => useUpdateTodoMutation(), { wrapper })

    act(() => {
      result.current.mutate({ todoId: 21, isCompleted: true })
    })

    await waitFor(() => {
      expect(result.current.pendingTodoIds.has(21)).toBe(true)
    })

    const optimisticallyOrderedTodos = queryClient.getQueryData<Todo[]>(TODOS_QUERY_KEY) ?? []
    expect(optimisticallyOrderedTodos.map((todo) => todo.id)).toEqual([20, 21, 22])
  })
})
