import { TodoList } from '../features/todos/components/TodoList'
import { TodoListEmptyState } from '../features/todos/components/TodoListEmptyState'
import { TodoListLoadingState } from '../features/todos/components/TodoListLoadingState'
import { TodoQuickAdd } from '../features/todos/components/TodoQuickAdd'
import { useCreateTodoMutation } from '../features/todos/hooks/useCreateTodoMutation'
import { useDeleteTodoMutation } from '../features/todos/hooks/useDeleteTodoMutation'
import { useUpdateTodoMutation } from '../features/todos/hooks/useUpdateTodoMutation'
import { useTodosQuery } from '../features/todos/hooks/useTodosQuery'

function App() {
  const todosQuery = useTodosQuery()
  const createTodoMutation = useCreateTodoMutation()
  const updateTodoMutation = useUpdateTodoMutation()
  const deleteTodoMutation = useDeleteTodoMutation()

  return (
    <main>
      <h1>Todo App</h1>
      <TodoQuickAdd
        isPending={createTodoMutation.isPending}
        isError={createTodoMutation.isError}
        onSubmit={(description) => createTodoMutation.mutate(description)}
      />
      {todosQuery.isPending && <TodoListLoadingState />}
      {!todosQuery.isPending && todosQuery.isError && <p>Unable to load tasks.</p>}
      {!todosQuery.isPending && !todosQuery.isError && todosQuery.data && todosQuery.data.length === 0 && (
        <TodoListEmptyState />
      )}
      {!todosQuery.isPending && !todosQuery.isError && todosQuery.data && todosQuery.data.length > 0 && (
        <TodoList
          todos={todosQuery.data}
          pendingTodoIds={updateTodoMutation.pendingTodoIds}
          failedTodoId={updateTodoMutation.failedTodoId}
          onToggleTodo={(todo) => {
            updateTodoMutation.mutate({
              todoId: todo.id,
              isCompleted: !todo.isCompleted,
            })
          }}
          pendingDeleteIds={deleteTodoMutation.pendingDeleteIds}
          failedDeleteTodoId={deleteTodoMutation.failedDeleteTodoId}
          onDeleteTodo={(todo) => {
            deleteTodoMutation.mutate({ todoId: todo.id })
          }}
        />
      )}
    </main>
  )
}

export default App
