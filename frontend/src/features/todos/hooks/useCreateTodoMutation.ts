import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { createTodo } from '../api/createTodo'
import type { Todo } from '../types'
import { TODOS_QUERY_KEY } from './useTodosQuery'

type CreateTodoContext = {
  optimisticTodoId: number
}

export function useCreateTodoMutation() {
  const queryClient = useQueryClient()
  const [createErrorMessage, setCreateErrorMessage] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: createTodo,
    onMutate: async (description): Promise<CreateTodoContext> => {
      await queryClient.cancelQueries({ queryKey: TODOS_QUERY_KEY })
      setCreateErrorMessage(null)

      const previousTodos = queryClient.getQueryData<Todo[]>(TODOS_QUERY_KEY) ?? []
      const minimumTodoId = previousTodos.reduce((minimum, todo) => Math.min(minimum, todo.id), 0)
      const optimisticTodoId = minimumTodoId <= 0 ? minimumTodoId - 1 : -1

      const optimisticTodo: Todo = {
        id: optimisticTodoId,
        description,
        isCompleted: false,
        createdAt: new Date().toISOString(),
      }

      queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, (currentTodos = []) => [...currentTodos, optimisticTodo])

      return { optimisticTodoId }
    },
    onError: (error, _description, context) => {
      if (context?.optimisticTodoId !== undefined) {
        queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, (currentTodos = []) =>
          currentTodos.filter((todo) => todo.id !== context.optimisticTodoId),
        )
      }

      setCreateErrorMessage(error instanceof Error ? error.message : 'Unable to create task.')
    },
    onSuccess: (createdTodo, _description, context) => {
      setCreateErrorMessage(null)
      queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, (currentTodos = []) => {
        const hasOptimisticTodo = currentTodos.some((todo) => todo.id === context?.optimisticTodoId)
        const hasCreatedTodo = currentTodos.some((todo) => todo.id === createdTodo.id)

        if (!hasOptimisticTodo) {
          if (hasCreatedTodo) {
            return currentTodos
          }

          return [...currentTodos, createdTodo]
        }

        return currentTodos.map((todo) =>
          todo.id === context?.optimisticTodoId ? createdTodo : todo,
        )
      })
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: TODOS_QUERY_KEY,
        refetchType: 'all',
      })
    },
  })

  return {
    ...mutation,
    createErrorMessage,
  }
}