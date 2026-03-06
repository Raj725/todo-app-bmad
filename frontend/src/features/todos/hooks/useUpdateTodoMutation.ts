import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { updateTodo, type UpdateTodoInput } from '../api/updateTodo'
import type { Todo } from '../types'
import { TODOS_QUERY_KEY } from './useTodosQuery'

type UpdateTodoContext = {
  previousTodos: Todo[]
}

export function useUpdateTodoMutation() {
  const queryClient = useQueryClient()
  const [pendingTodoId, setPendingTodoId] = useState<number | null>(null)
  const [failedTodoId, setFailedTodoId] = useState<number | null>(null)

  const mutation = useMutation({
    mutationFn: updateTodo,
    onMutate: async (variables: UpdateTodoInput): Promise<UpdateTodoContext> => {
      await queryClient.cancelQueries({ queryKey: TODOS_QUERY_KEY })

      const previousTodos = queryClient.getQueryData<Todo[]>(TODOS_QUERY_KEY) ?? []

      setPendingTodoId(variables.todoId)
      setFailedTodoId((current) => (current === variables.todoId ? null : current))

      queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, (currentTodos = []) =>
        currentTodos.map((todo) =>
          todo.id === variables.todoId
            ? {
                ...todo,
                isCompleted: variables.isCompleted,
              }
            : todo,
        ),
      )

      return { previousTodos }
    },
    onError: (_error, variables, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, context.previousTodos)
      }
      setFailedTodoId(variables.todoId)
    },
    onSuccess: (updatedTodo, variables) => {
      setFailedTodoId((current) => (current === variables.todoId ? null : current))
      queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, (currentTodos = []) =>
        currentTodos.map((todo) => (todo.id === updatedTodo.id ? updatedTodo : todo)),
      )
    },
    onSettled: async () => {
      setPendingTodoId(null)
      await queryClient.invalidateQueries({ queryKey: TODOS_QUERY_KEY })
    },
  })

  return {
    ...mutation,
    pendingTodoId,
    failedTodoId,
  }
}