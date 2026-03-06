import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { deleteTodo, type DeleteTodoInput } from '../api/deleteTodo'
import type { Todo } from '../types'
import { TODOS_QUERY_KEY } from './useTodosQuery'

type DeleteTodoContext = {
  deletedTodo: Todo | null
}

export function useDeleteTodoMutation() {
  const queryClient = useQueryClient()
  const [pendingDeleteIds, setPendingDeleteIds] = useState<Set<number>>(() => new Set())
  const [failedDeleteTodoId, setFailedDeleteTodoId] = useState<number | null>(null)

  const mutation = useMutation({
    mutationFn: deleteTodo,
    onMutate: async (variables: DeleteTodoInput): Promise<DeleteTodoContext> => {
      await queryClient.cancelQueries({ queryKey: TODOS_QUERY_KEY })

      const previousTodos = queryClient.getQueryData<Todo[]>(TODOS_QUERY_KEY) ?? []
      const deletedTodo = previousTodos.find((todo) => todo.id === variables.todoId) ?? null

      setPendingDeleteIds((prev) => new Set([...prev, variables.todoId]))
      setFailedDeleteTodoId((current) => (current === variables.todoId ? null : current))

      // Optimistically remove the todo from cache
      queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, (currentTodos = []) =>
        currentTodos.filter((todo) => todo.id !== variables.todoId),
      )

      return { deletedTodo }
    },
    onError: (_error, variables, context) => {
      // Rollback only the failed item to avoid stale overwrite during concurrent deletes.
      if (context?.deletedTodo) {
        const deletedTodo = context.deletedTodo
        queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, (currentTodos = []) => {
          if (currentTodos.some((todo) => todo.id === deletedTodo.id)) {
            return currentTodos
          }

          return [...currentTodos, deletedTodo]
        })
      }
      setFailedDeleteTodoId(variables.todoId)
    },
    onSuccess: (_data, variables) => {
      setFailedDeleteTodoId((current) => (current === variables.todoId ? null : current))
    },
    onSettled: async (_data, _error, variables) => {
      setPendingDeleteIds((prev) => {
        const next = new Set(prev)
        next.delete(variables.todoId)
        return next
      })
      await queryClient.invalidateQueries({ queryKey: TODOS_QUERY_KEY })
    },
  })

  return {
    ...mutation,
    pendingDeleteIds,
    failedDeleteTodoId,
  }
}
