import { afterEach, describe, expect, it, vi } from 'vitest'

import { updateTodo } from './updateTodo'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('updateTodo', () => {
  it('rejects when backend returns a non-success status code', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: { message: 'not found' } }),
    } as Response)

    await expect(updateTodo({ todoId: 22, isCompleted: true })).rejects.toThrow('Failed to update todo')
  })

  it('maps a valid success envelope from snake_case to camelCase', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          id: 22,
          description: 'Toggle task',
          is_completed: true,
          created_at: '2026-03-06T15:20:00.000Z',
        },
      }),
    } as Response)

    await expect(updateTodo({ todoId: 22, isCompleted: true })).resolves.toEqual({
      id: 22,
      description: 'Toggle task',
      isCompleted: true,
      createdAt: '2026-03-06T15:20:00.000Z',
    })
  })

  it('rejects malformed response envelopes', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        item: {
          id: 22,
        },
      }),
    } as Response)

    await expect(updateTodo({ todoId: 22, isCompleted: true })).rejects.toThrow(
      'Invalid update todo response envelope',
    )
  })
})