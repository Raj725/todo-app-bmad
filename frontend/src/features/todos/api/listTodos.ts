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

const isSuccessTodoListResponse = (value: unknown): value is SuccessResponse<TodoApiResponse[]> => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const payload = value as Partial<SuccessResponse<unknown>>

  return Array.isArray(payload.data) && payload.data.every(isTodoApiResponse)
}

export async function listTodos(): Promise<Todo[]> {
  const response = await fetch(`${API_BASE_URL}/todos`)

  if (!response.ok) {
    throw new Error('Failed to load todos')
  }

  const payload = await response.json()

  if (!isSuccessTodoListResponse(payload)) {
    throw new Error('Invalid todo list response envelope')
  }

  return payload.data.map(toTodo)
}
