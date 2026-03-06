import { FormEvent, useState } from 'react'

type TodoQuickAddProps = {
  isPending: boolean
  isError: boolean
  onSubmit: (description: string) => void
}

export function TodoQuickAdd({ isPending, isError, onSubmit }: TodoQuickAddProps) {
  const [description, setDescription] = useState('')
  const [lastAttemptedDescription, setLastAttemptedDescription] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const normalizedDescription = description.trim()

    if (normalizedDescription.length === 0 || isPending) {
      return
    }

    setLastAttemptedDescription(normalizedDescription)
    onSubmit(normalizedDescription)
    setDescription('')
  }

  const handleRetry = () => {
    if (lastAttemptedDescription.length === 0 || isPending) {
      return
    }

    onSubmit(lastAttemptedDescription)
  }

  return (
    <section aria-label="Quick add task section">
      <form onSubmit={handleSubmit}>
        <label htmlFor="quick-add-description">Task description</label>
        <input
          id="quick-add-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Add a task"
        />
        <button type="submit" disabled={isPending}>
          {isPending ? 'Adding task...' : 'Quick add task'}
        </button>
      </form>
      {isError && (
        <p role="alert">
          Unable to create task.
          <button type="button" onClick={handleRetry} disabled={isPending}>
            Retry quick add
          </button>
        </p>
      )}
    </section>
  )
}