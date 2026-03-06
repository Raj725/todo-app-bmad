import { describe, expect, it } from 'vitest'

import { normalizeTodoApiError } from './normalizeTodoApiError'

describe('normalizeTodoApiError', () => {
  it('returns envelope error.message when the error body is valid', () => {
    const result = normalizeTodoApiError(
      { error: { code: 'NOT_FOUND', message: 'Todo not found', details: [], request_id: 'req-1' } },
      'Failed to delete todo',
    )

    expect(result).toBe('Todo not found')
  })

  it('returns fallback when body does not match the standardized envelope', () => {
    const result = normalizeTodoApiError({ message: 'bad shape' }, 'Failed to update todo')

    expect(result).toBe('Failed to update todo')
  })

  it('returns fallback when envelope message is not a string', () => {
    const result = normalizeTodoApiError(
      { error: { code: 'VALIDATION_ERROR', message: 123, details: [], request_id: 'req-2' } },
      'Failed to create todo',
    )

    expect(result).toBe('Failed to create todo')
  })
})
