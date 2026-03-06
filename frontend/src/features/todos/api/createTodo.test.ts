import { afterEach, describe, expect, it, vi } from 'vitest'

import { createTodo } from './createTodo'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('createTodo', () => {
  it('rejects when backend returns a non-success status code', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: { message: 'server error' } }),
    } as Response)

    await expect(createTodo('Add tests')).rejects.toThrow('Failed to create todo')
  })

  it('maps a valid success envelope from snake_case to camelCase', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          id: 1,
          description: 'Add tests',
          is_completed: false,
          created_at: '2026-03-06T12:00:00.000Z',
        },
      }),
    } as Response)

    await expect(createTodo('Add tests')).resolves.toEqual({
      id: 1,
      description: 'Add tests',
      isCompleted: false,
      createdAt: '2026-03-06T12:00:00.000Z',
    })
  })

  it('rejects malformed response envelopes', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        todo: {
          id: 1,
        },
      }),
    } as Response)

    await expect(createTodo('Bad envelope')).rejects.toThrow('Invalid create todo response envelope')
  })
})