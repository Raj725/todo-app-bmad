import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { Todo } from '../types'
import { TODOS_QUERY_KEY } from './useTodosQuery'
import { useDeleteTodoMutation } from './useDeleteTodoMutation'

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

describe('useDeleteTodoMutation', () => {
  it('exposes empty pendingDeleteIds Set and null failedDeleteTodoId on initial render', () => {
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useDeleteTodoMutation(), { wrapper })

    expect(result.current.pendingDeleteIds).toEqual(new Set())
    expect(result.current.failedDeleteTodoId).toBeNull()
  })

  it('optimistically removes the todo from the cache on mutate', async () => {
    // Never resolves so we can inspect mid-flight state
    vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise(() => undefined))

    const todo = seedTodo({ id: 10 })
    const other = seedTodo({ id: 11, description: 'Keep me' })
    const { wrapper, queryClient } = makeWrapper()
    queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, [todo, other])

    const { result } = renderHook(() => useDeleteTodoMutation(), { wrapper })

    act(() => {
      result.current.mutate({ todoId: 10 })
    })

    await waitFor(() => {
      const todos = queryClient.getQueryData<Todo[]>(TODOS_QUERY_KEY)
      expect(todos?.find((t) => t.id === 10)).toBeUndefined()
      expect(todos?.find((t) => t.id === 11)).toBeDefined()
    })
  })

  it('adds todoId to pendingDeleteIds while in-flight and removes it on settle', async () => {
    let resolveResponse: (value: Response) => void
    const deferredResponse = new Promise<Response>((resolve) => {
      resolveResponse = resolve
    })

    vi.spyOn(globalThis, 'fetch').mockReturnValue(deferredResponse)

    const todo = seedTodo({ id: 5 })
    const { wrapper, queryClient } = makeWrapper()
    queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, [todo])

    const { result } = renderHook(() => useDeleteTodoMutation(), { wrapper })

    act(() => {
      result.current.mutate({ todoId: 5 })
    })

    await waitFor(() => {
      expect(result.current.pendingDeleteIds.has(5)).toBe(true)
    })

    resolveResponse!({ ok: true, status: 204 } as Response)

    await waitFor(() => {
      expect(result.current.pendingDeleteIds.has(5)).toBe(false)
    })
  })

  it('rolls back the optimistic removal and sets failedDeleteTodoId on failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: { message: 'server error' } }),
    } as Response)

    const todo = seedTodo({ id: 7, isCompleted: false })
    const { wrapper, queryClient } = makeWrapper()
    queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, [todo])

    const { result } = renderHook(() => useDeleteTodoMutation(), { wrapper })

    act(() => {
      result.current.mutate({ todoId: 7 })
    })

    await waitFor(() => {
      expect(result.current.failedDeleteTodoId).toBe(7)
    })

    const todos = queryClient.getQueryData<Todo[]>(TODOS_QUERY_KEY)
    expect(todos?.find((t) => t.id === 7)).toBeDefined()
    expect(result.current.pendingDeleteIds.has(7)).toBe(false)
  })

  it('tracks concurrent delete operations in pendingDeleteIds independently', async () => {
    vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise(() => undefined))

    const todos: Todo[] = [
      seedTodo({ id: 5, description: 'Task A' }),
      seedTodo({ id: 9, description: 'Task B' }),
    ]
    const { wrapper, queryClient } = makeWrapper()
    queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, todos)

    const { result } = renderHook(() => useDeleteTodoMutation(), { wrapper })

    act(() => {
      result.current.mutate({ todoId: 5 })
    })
    act(() => {
      result.current.mutate({ todoId: 9 })
    })

    await waitFor(() => {
      expect(result.current.pendingDeleteIds.has(5)).toBe(true)
      expect(result.current.pendingDeleteIds.has(9)).toBe(true)
    })
  })

  it('clears failedDeleteTodoId after a successful retry', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: { message: 'server error' } }),
      } as Response)
      .mockResolvedValueOnce({ ok: true, status: 204 } as Response)

    const todo = seedTodo({ id: 3 })
    const { wrapper, queryClient } = makeWrapper()
    queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, [todo])

    const { result } = renderHook(() => useDeleteTodoMutation(), { wrapper })

    act(() => {
      result.current.mutate({ todoId: 3 })
    })

    await waitFor(() => {
      expect(result.current.failedDeleteTodoId).toBe(3)
    })

    act(() => {
      result.current.mutate({ todoId: 3 })
    })

    await waitFor(() => {
      expect(result.current.failedDeleteTodoId).toBeNull()
    })
  })

  it('does not restore a successfully deleted sibling todo when another concurrent delete fails', async () => {
    let resolveDeleteFive: (value: Response) => void
    let resolveDeleteNine: (value: Response) => void

    const deleteFiveResponse = new Promise<Response>((resolve) => {
      resolveDeleteFive = resolve
    })

    const deleteNineResponse = new Promise<Response>((resolve) => {
      resolveDeleteNine = resolve
    })

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input)

      if (url.endsWith('/todos/5')) {
        return deleteFiveResponse
      }

      if (url.endsWith('/todos/9')) {
        return deleteNineResponse
      }

      return { ok: true, status: 204 } as Response
    })

    const todos: Todo[] = [
      seedTodo({ id: 5, description: 'Delete succeeds' }),
      seedTodo({ id: 9, description: 'Delete fails' }),
    ]

    const { wrapper, queryClient } = makeWrapper()
    queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, todos)

    const { result } = renderHook(() => useDeleteTodoMutation(), { wrapper })

    act(() => {
      result.current.mutate({ todoId: 5 })
    })
    act(() => {
      result.current.mutate({ todoId: 9 })
    })

    await waitFor(() => {
      const current = queryClient.getQueryData<Todo[]>(TODOS_QUERY_KEY) ?? []
      expect(current.find((todo) => todo.id === 5)).toBeUndefined()
      expect(current.find((todo) => todo.id === 9)).toBeUndefined()
    })

    resolveDeleteFive!({ ok: true, status: 204 } as Response)
    resolveDeleteNine!({
      ok: false,
      status: 500,
      json: async () => ({ error: { message: 'delete failed for 9' } }),
    } as Response)

    await waitFor(() => {
      const current = queryClient.getQueryData<Todo[]>(TODOS_QUERY_KEY) ?? []
      expect(current.find((todo) => todo.id === 5)).toBeUndefined()
      expect(current.find((todo) => todo.id === 9)).toBeDefined()
      expect(result.current.failedDeleteTodoId).toBe(9)
    })
  })
})
