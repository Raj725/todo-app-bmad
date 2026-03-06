type TodoApiErrorEnvelope = {
  error: {
    code: string
    message: string
    details: unknown[]
    request_id: string
  }
}

const isTodoApiErrorEnvelope = (value: unknown): value is TodoApiErrorEnvelope => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const payload = value as { error?: unknown }

  if (typeof payload.error !== 'object' || payload.error === null) {
    return false
  }

  const error = payload.error as Partial<TodoApiErrorEnvelope['error']>

  return (
    typeof error.code === 'string' &&
    typeof error.message === 'string' &&
    Array.isArray(error.details) &&
    typeof error.request_id === 'string'
  )
}

export function normalizeTodoApiError(errorBody: unknown, fallbackMessage: string): string {
  if (!isTodoApiErrorEnvelope(errorBody)) {
    return fallbackMessage
  }

  return errorBody.error.message
}