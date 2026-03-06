import type { Todo } from '../types'

type TodoApiResponse = {
  id: number
  description: string
  is_completed: boolean
  created_at: string
}

type SuccessResponse<TPayload> = {
  data: TPayload
}

type UpdateTodoPayload = {
  is_completed: boolean
}

export type UpdateTodoInput = {
  todoId: number
  isCompleted: boolean
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'

const toTodo = (item: TodoApiResponse): Todo => ({
  id: item.id,
  description: item.description,
  isCompleted: item.is_completed,
  createdAt: item.created_at,
})

const isTodoApiResponse = (value: unknown): value is TodoApiResponse => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const item = value as Partial<TodoApiResponse>

  return (
    typeof item.id === 'number' &&
    typeof item.description === 'string' &&
    typeof item.is_completed === 'boolean' &&
    typeof item.created_at === 'string'
  )
}

const isSuccessUpdateTodoResponse = (value: unknown): value is SuccessResponse<TodoApiResponse> => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const payload = value as Partial<SuccessResponse<unknown>>

  return isTodoApiResponse(payload.data)
}

export async function updateTodo(input: UpdateTodoInput): Promise<Todo> {
  const payload: UpdateTodoPayload = {
    is_completed: input.isCompleted,
  }

  const response = await fetch(`${API_BASE_URL}/todos/${input.todoId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    let errorMessage = 'Failed to update todo'
    try {
      const errorBody = (await response.json()) as unknown
      if (
        typeof errorBody === 'object' &&
        errorBody !== null &&
        'error' in errorBody &&
        typeof (errorBody as { error: unknown }).error === 'object' &&
        (errorBody as { error: unknown }).error !== null &&
        'message' in (errorBody as { error: { message: unknown } }).error &&
        typeof (errorBody as { error: { message: unknown } }).error.message === 'string'
      ) {
        errorMessage = (errorBody as { error: { message: string } }).error.message
      }
    } catch {
      // ignore parse errors, use default message
    }
    throw new Error(errorMessage)
  }

  const parsed = await response.json()

  if (!isSuccessUpdateTodoResponse(parsed)) {
    throw new Error('Invalid update todo response envelope')
  }

  return toTodo(parsed.data)
}