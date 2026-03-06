import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createTodo } from '../api/createTodo'
import type { Todo } from '../types'
import { TODOS_QUERY_KEY } from './useTodosQuery'

export function useCreateTodoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTodo,
    onMutate: async (description) => {
      await queryClient.cancelQueries({ queryKey: TODOS_QUERY_KEY })

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
    onError: (_error, _description, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, context.previousTodos)
      }
    },
    onSuccess: (createdTodo, _description, context) => {
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
}