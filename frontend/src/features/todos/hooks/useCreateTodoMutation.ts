import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { createTodo } from '../api/createTodo'
import type { Todo } from '../types'
import { TODOS_QUERY_KEY } from './useTodosQuery'

export function useCreateTodoMutation() {
  const queryClient = useQueryClient()
  const [createErrorMessage, setCreateErrorMessage] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: createTodo,
    onMutate: async (description) => {
      await queryClient.cancelQueries({ queryKey: TODOS_QUERY_KEY })
      setCreateErrorMessage(null)

      const previousTodos = queryClient.getQueryData<Todo[]>(TODOS_QUERY_KEY) ?? []
      const optimisticTodo: Todo = {
        id: -Date.now(),
        description,
        isCompleted: false,
        createdAt: new Date().toISOString(),
      }

      queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, [...previousTodos, optimisticTodo])

      return { previousTodos, optimisticTodoId: optimisticTodo.id }
    },
    onError: (error, _description, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, context.previousTodos)
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