import { TodoList } from '../features/todos/components/TodoList'
import { TodoListEmptyState } from '../features/todos/components/TodoListEmptyState'
import { TodoListLoadingState } from '../features/todos/components/TodoListLoadingState'
import { TodoQuickAdd } from '../features/todos/components/TodoQuickAdd'
import { useCreateTodoMutation } from '../features/todos/hooks/useCreateTodoMutation'
import { useDeleteTodoMutation } from '../features/todos/hooks/useDeleteTodoMutation'
import { useUpdateTodoMutation } from '../features/todos/hooks/useUpdateTodoMutation'
import { useTodosQuery } from '../features/todos/hooks/useTodosQuery'

const TASK_LIST_PAGE_SIZE = 25

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
        errorMessage={createTodoMutation.createErrorMessage}
        onSubmit={(description) => createTodoMutation.mutate(description)}
      />
      <section aria-labelledby="task-list-heading">
        <h2 id="task-list-heading">Tasks</h2>
        {todosQuery.isPending && <TodoListLoadingState />}
        {!todosQuery.isPending && todosQuery.isError && <p role="alert">Unable to load tasks.</p>}
        {!todosQuery.isPending && !todosQuery.isError && todosQuery.data && todosQuery.data.length === 0 && (
          <TodoListEmptyState />
        )}
        {!todosQuery.isPending && !todosQuery.isError && todosQuery.data && todosQuery.data.length > 0 && (
          <TodoList
            todos={todosQuery.data}
            pageSize={TASK_LIST_PAGE_SIZE}
            pendingTodoIds={updateTodoMutation.pendingTodoIds}
            failedToggleTodoIds={updateTodoMutation.failedToggleTodoIds}
            failedToggleErrorMessages={updateTodoMutation.failedToggleErrorMessages}
            failedEditTodoIds={updateTodoMutation.failedDescriptionTodoIds}
            failedEditErrorMessages={updateTodoMutation.failedDescriptionErrorMessages}
            onToggleTodo={(todo) => {
              updateTodoMutation.mutate({
                todoId: todo.id,
                isCompleted: !todo.isCompleted,
              })
            }}
            onEditTodo={(todo, description) => {
              updateTodoMutation.mutate({
                todoId: todo.id,
                description,
              })
            }}
            pendingDeleteIds={deleteTodoMutation.pendingDeleteIds}
            failedDeleteTodoIds={deleteTodoMutation.failedDeleteTodoIds}
            failedDeleteErrorMessages={deleteTodoMutation.failedDeleteErrorMessages}
            onDeleteTodo={(todo) => {
              deleteTodoMutation.mutate({ todoId: todo.id })
            }}
          />
        )}
      </section>
    </main>
  )
}

export default App
