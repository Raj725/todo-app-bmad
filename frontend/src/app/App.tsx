import { TodoList } from '../features/todos/components/TodoList'
import { TodoListEmptyState } from '../features/todos/components/TodoListEmptyState'
import { TodoListLoadingState } from '../features/todos/components/TodoListLoadingState'
import { useTodosQuery } from '../features/todos/hooks/useTodosQuery'

function App() {
  const todosQuery = useTodosQuery()

  return (
    <main>
      <h1>Todo App</h1>
      {todosQuery.isPending && <TodoListLoadingState />}
      {!todosQuery.isPending && todosQuery.isError && <p>Unable to load tasks.</p>}
      {!todosQuery.isPending && !todosQuery.isError && todosQuery.data && todosQuery.data.length === 0 && (
        <TodoListEmptyState />
      )}
      {!todosQuery.isPending && !todosQuery.isError && todosQuery.data && todosQuery.data.length > 0 && (
        <TodoList todos={todosQuery.data} />
      )}
    </main>
  )
}

export default App
