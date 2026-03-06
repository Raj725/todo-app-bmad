import type { Todo } from './types'

export const compareTodosByActionableOrder = (left: Todo, right: Todo): number => {
  if (left.isCompleted !== right.isCompleted) {
    return left.isCompleted ? 1 : -1
  }

  const createdAtDiff = new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  if (!Number.isNaN(createdAtDiff) && createdAtDiff !== 0) {
    return createdAtDiff
  }

  return right.id - left.id
}

export const sortTodosByActionableOrder = (todos: Todo[]): Todo[] => {
  return [...todos].sort(compareTodosByActionableOrder)
}
