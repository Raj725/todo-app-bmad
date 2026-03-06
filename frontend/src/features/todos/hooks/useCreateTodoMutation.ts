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

      const optimisticTodo: Todo = {
        id: -Date.now(),
        description,
        isCompleted: false,
        createdAt: new Date().toISOString(),
      }

      queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, (currentTodos = []) => [...currentTodos, optimisticTodo])

      return { optimisticTodoId: optimisticTodo.id }
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

        if (!hasOptimisticTodo) {
          return [...currentTodos, createdTodo]
        }

        return currentTodos.map((todo) =>
          todo.id === context?.optimisticTodoId ? createdTodo : todo,
        )
      })
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: TODOS_QUERY_KEY })
    },
  })

  return {
    ...mutation,
    createErrorMessage,
  }
}