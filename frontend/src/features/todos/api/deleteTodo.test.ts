import { afterEach, describe, expect, it, vi } from 'vitest'

import { deleteTodo } from './deleteTodo'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('deleteTodo', () => {
  it('resolves without value on a 204 success response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 204,
    } as Response)

    await expect(deleteTodo({ todoId: 42 })).resolves.toBeUndefined()
  })

  it('rejects with server error message from error envelope on non-2xx', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({
        error: {
          code: 'NOT_FOUND',
          message: 'Todo with id 42 not found',
          details: [],
          request_id: 'delete-req-1',
        },
      }),
    } as Response)

    await expect(deleteTodo({ todoId: 42 })).rejects.toThrow('Todo with id 42 not found')
  })

  it('rejects with generic message when error body cannot be parsed', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('not json')
      },
    } as unknown as Response)

    await expect(deleteTodo({ todoId: 42 })).rejects.toThrow('Failed to delete todo')
  })

  it('calls DELETE on the correct endpoint URL', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 204,
    } as Response)

    await deleteTodo({ todoId: 7 })

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/todos/7'),
      expect.objectContaining({ method: 'DELETE' }),
    )
  })
})
