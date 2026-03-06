import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createTodo } from '../api/createTodo'
import { TODOS_QUERY_KEY } from './useTodosQuery'

export function useCreateTodoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTodo,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: TODOS_QUERY_KEY })
    },
  })
}