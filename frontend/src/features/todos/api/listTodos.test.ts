import { afterEach, describe, expect, it, vi } from 'vitest'

import { listTodos } from './listTodos'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('listTodos', () => {
  it('rejects when backend returns a non-success status code', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: { message: 'server error' } }),
    } as Response)

    await expect(listTodos()).rejects.toThrow('Failed to load todos')
  })

  it('maps a valid success envelope from snake_case to camelCase', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          {
            id: 42,
            description: 'Review implementation',
            is_completed: false,
            created_at: '2026-03-05T10:15:30.000Z',
          },
        ],
      }),
    } as Response)

    await expect(listTodos()).resolves.toEqual([
      {
        id: 42,
        description: 'Review implementation',
        isCompleted: false,
        createdAt: '2026-03-05T10:15:30.000Z',
      },
    ])
  })

  it('rejects malformed response envelopes', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [],
      }),
    } as Response)

    await expect(listTodos()).rejects.toThrow('Invalid todo list response envelope')
  })
})
