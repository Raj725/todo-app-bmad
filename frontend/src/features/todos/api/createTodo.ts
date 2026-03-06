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

type CreateTodoPayload = {
  description: string
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

const isSuccessCreateTodoResponse = (value: unknown): value is SuccessResponse<TodoApiResponse> => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const payload = value as Partial<SuccessResponse<unknown>>

  return isTodoApiResponse(payload.data)
}

export async function createTodo(description: string): Promise<Todo> {
  const payload: CreateTodoPayload = { description }

  const response = await fetch(`${API_BASE_URL}/todos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error('Failed to create todo')
  }

  const parsed = await response.json()

  if (!isSuccessCreateTodoResponse(parsed)) {
    throw new Error('Invalid create todo response envelope')
  }

  return toTodo(parsed.data)
}