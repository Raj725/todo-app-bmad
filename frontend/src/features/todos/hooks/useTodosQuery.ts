import { useQuery } from '@tanstack/react-query'

import { listTodos } from '../api/listTodos'

export function useTodosQuery() {
  return useQuery({
    queryKey: ['todos'],
    queryFn: listTodos,
  })
}
