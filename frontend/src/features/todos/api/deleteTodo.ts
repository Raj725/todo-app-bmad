import { normalizeTodoApiError } from './normalizeTodoApiError'

export type DeleteTodoInput = {
  todoId: number
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'

export async function deleteTodo(input: DeleteTodoInput): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/todos/${input.todoId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    let errorMessage = 'Failed to delete todo'
    try {
      const errorBody = (await response.json()) as unknown
      errorMessage = normalizeTodoApiError(errorBody, errorMessage)
    } catch {
      // ignore parse errors, use default message
    }
    throw new Error(errorMessage)
  }
}
