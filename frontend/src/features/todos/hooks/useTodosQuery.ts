import { useQuery } from '@tanstack/react-query'

import { listTodos } from '../api/listTodos'

export const TODOS_QUERY_KEY = ['todos'] as const

export function useTodosQuery() {
  return useQuery({
    queryKey: TODOS_QUERY_KEY,
    queryFn: listTodos,
  })
}
