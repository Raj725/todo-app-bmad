import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { updateTodo, type UpdateTodoInput } from '../api/updateTodo'
import { sortTodosByActionableOrder } from '../orderTodos'
import type { Todo } from '../types'
import { TODOS_QUERY_KEY } from './useTodosQuery'

type UpdateTodoContext = {
  previousTodo: Todo | null
}

export function useUpdateTodoMutation() {
  const queryClient = useQueryClient()
  const [pendingTodoIds, setPendingTodoIds] = useState<Set<number>>(() => new Set())
  const [failedToggleTodoIds, setFailedToggleTodoIds] = useState<Set<number>>(() => new Set())
  const [failedDescriptionTodoIds, setFailedDescriptionTodoIds] = useState<Set<number>>(() => new Set())
  const [failedToggleErrorMessages, setFailedToggleErrorMessages] = useState<Map<number, string>>(
    () => new Map(),
  )
  const [failedDescriptionErrorMessages, setFailedDescriptionErrorMessages] = useState<Map<number, string>>(
    () => new Map(),
  )

  const mutation = useMutation({
    mutationFn: updateTodo,
    onMutate: async (variables: UpdateTodoInput): Promise<UpdateTodoContext> => {
      await queryClient.cancelQueries({ queryKey: TODOS_QUERY_KEY })

      const previousTodos = queryClient.getQueryData<Todo[]>(TODOS_QUERY_KEY) ?? []
      const previousTodo = previousTodos.find((todo) => todo.id === variables.todoId) ?? null

      setPendingTodoIds((prev) => new Set([...prev, variables.todoId]))
      if (typeof variables.description === 'string') {
        setFailedDescriptionTodoIds((current) => {
          const next = new Set(current)
          next.delete(variables.todoId)
          return next
        })
        setFailedDescriptionErrorMessages((current) => {
          const next = new Map(current)
          next.delete(variables.todoId)
          return next
        })
      }
      if (typeof variables.isCompleted === 'boolean') {
        setFailedToggleTodoIds((current) => {
          const next = new Set(current)
          next.delete(variables.todoId)
          return next
        })
        setFailedToggleErrorMessages((current) => {
          const next = new Map(current)
          next.delete(variables.todoId)
          return next
        })
      }

      queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, (currentTodos = []) =>
        sortTodosByActionableOrder(
          currentTodos.map((todo) =>
            todo.id === variables.todoId
              ? {
                  ...todo,
                  isCompleted:
                    typeof variables.isCompleted === 'boolean' ? variables.isCompleted : todo.isCompleted,
                  description:
                    typeof variables.description === 'string' ? variables.description : todo.description,
                }
              : todo,
          ),
        ),
      )

      return { previousTodo }
    },
    onError: (error, variables, context) => {
      if (context?.previousTodo) {
        queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, (currentTodos = []) =>
          sortTodosByActionableOrder(
            currentTodos.map((todo) => (todo.id === context.previousTodo?.id ? context.previousTodo : todo)),
          ),
        )
      }

      const errorMessage = error instanceof Error ? error.message : 'Unable to update task.'

      if (typeof variables.description === 'string') {
        setFailedDescriptionTodoIds((current) => new Set([...current, variables.todoId]))
        setFailedDescriptionErrorMessages((current) => {
          const next = new Map(current)
          next.set(variables.todoId, errorMessage)
          return next
        })
      }
      if (typeof variables.isCompleted === 'boolean') {
        setFailedToggleTodoIds((current) => new Set([...current, variables.todoId]))
        setFailedToggleErrorMessages((current) => {
          const next = new Map(current)
          next.set(variables.todoId, errorMessage)
          return next
        })
      }
    },
    onSuccess: (updatedTodo, variables) => {
      if (typeof variables.description === 'string') {
        setFailedDescriptionTodoIds((current) => {
          const next = new Set(current)
          next.delete(variables.todoId)
          return next
        })
        setFailedDescriptionErrorMessages((current) => {
          const next = new Map(current)
          next.delete(variables.todoId)
          return next
        })
      }
      if (typeof variables.isCompleted === 'boolean') {
        setFailedToggleTodoIds((current) => {
          const next = new Set(current)
          next.delete(variables.todoId)
          return next
        })
        setFailedToggleErrorMessages((current) => {
          const next = new Map(current)
          next.delete(variables.todoId)
          return next
        })
      }
      queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, (currentTodos = []) =>
        sortTodosByActionableOrder(
          currentTodos.map((todo) => (todo.id === updatedTodo.id ? updatedTodo : todo)),
        ),
      )
    },
    onSettled: async (_data, _error, variables) => {
      setPendingTodoIds((prev) => {
        const next = new Set(prev)
        next.delete(variables.todoId)
        return next
      })
      await queryClient.invalidateQueries({
        queryKey: TODOS_QUERY_KEY,
        refetchType: 'all',
      })
    },
  })

  return {
    ...mutation,
    pendingTodoIds,
    failedToggleTodoIds,
    failedDescriptionTodoIds,
    failedToggleErrorMessages,
    failedDescriptionErrorMessages,
  }
}