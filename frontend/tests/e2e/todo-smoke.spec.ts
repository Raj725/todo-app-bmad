import { expect, test } from '@playwright/test'

type TodoApiItem = {
  id: number
  description: string
  is_completed: boolean
  created_at: string
}

test('quick add and toggle complete in browser', async ({ page }) => {
  const todos: TodoApiItem[] = []
  let nextId = 1

  await page.route(/\/todos(?:\/\d+)?(?:\?.*)?$/, async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: todos }),
      })
      return
    }

    if (route.request().method() === 'POST') {
      const requestBody = route.request().postDataJSON() as { description: string }
      const createdTodo: TodoApiItem = {
        id: nextId,
        description: requestBody.description,
        is_completed: false,
        created_at: `2026-03-06T15:00:0${nextId}.000Z`,
      }

      nextId += 1
      todos.unshift(createdTodo)

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ data: createdTodo }),
      })
      return
    }

    if (route.request().method() === 'PATCH') {
      const updateBody = route.request().postDataJSON() as { is_completed: boolean }
      const todoId = Number(route.request().url().split('/').pop())
      const todo = todos.find((item) => item.id === todoId)

      if (!todo) {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: { message: 'Todo not found' } }),
        })
        return
      }

      todo.is_completed = updateBody.is_completed

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: todo }),
      })
      return
    }

    await route.fallback()
  })

  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Todo App' })).toBeVisible()
  await expect(page.getByText('No tasks yet.')).toBeVisible()

  await page.getByLabel('Task description').fill('Playwright smoke task')
  await page.getByRole('button', { name: 'Quick add task' }).click()

  await expect(page.getByText('Playwright smoke task')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Mark task "Playwright smoke task" as complete' })).toBeVisible()

  await page.getByRole('button', { name: 'Mark task "Playwright smoke task" as complete' }).click()

  await expect(page.getByText('Completed')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Mark task "Playwright smoke task" as active' })).toBeVisible()
})

test('failed mutation remains scoped and does not block unrelated task actions', async ({ page }) => {
  const todos: TodoApiItem[] = [
    {
      id: 1,
      description: 'Will fail toggle',
      is_completed: false,
      created_at: '2026-03-06T15:00:01.000Z',
    },
    {
      id: 2,
      description: 'Should still work',
      is_completed: false,
      created_at: '2026-03-06T15:00:02.000Z',
    },
  ]
  let failedToggleAttempts = 0

  await page.route(/\/todos(?:\/\d+)?(?:\?.*)?$/, async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: todos }),
      })
      return
    }

    if (route.request().method() === 'PATCH') {
      const todoId = Number(route.request().url().split('/').pop())
      const updateBody = route.request().postDataJSON() as { is_completed: boolean }

      if (todoId === 1) {
        failedToggleAttempts += 1

        if (failedToggleAttempts === 1) {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({
              error: {
                code: 'TODO_UPDATE_FAILED',
                message: 'Toggle failed for first task.',
                details: [],
                request_id: 'req-toggle-fail-1',
              },
            }),
          })
          return
        }

        const todo = todos.find((item) => item.id === todoId)!
        todo.is_completed = updateBody.is_completed

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: todo }),
        })
        return
      }

      const todo = todos.find((item) => item.id === todoId)
      if (!todo) {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            error: {
              code: 'TODO_NOT_FOUND',
              message: 'Todo not found',
              details: [],
              request_id: 'req-not-found',
            },
          }),
        })
        return
      }

      todo.is_completed = updateBody.is_completed

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: todo }),
      })
      return
    }

    await route.fallback()
  })

  await page.goto('/')

  await expect(page.getByText('Will fail toggle')).toBeVisible()
  await expect(page.getByText('Should still work')).toBeVisible()

  await page.getByRole('button', { name: 'Mark task "Will fail toggle" as complete' }).click()
  await expect(page.getByText('Toggle failed for first task.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Retry toggle task "Will fail toggle"' })).toBeVisible()

  await page.getByRole('button', { name: 'Mark task "Should still work" as complete' }).click()
  await expect(page.getByRole('button', { name: 'Mark task "Should still work" as active' })).toBeVisible()

  await page.getByRole('button', { name: 'Retry toggle task "Will fail toggle"' }).click()
  await expect(page.getByRole('button', { name: 'Mark task "Will fail toggle" as active' })).toBeVisible()
  await expect(page.getByText('Toggle failed for first task.')).not.toBeVisible()
})

test('real backend integration works without CORS errors', async ({ page }) => {
  const description = `CORS integration task ${Date.now()}`

  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Todo App' })).toBeVisible()
  await expect(page.getByText('Unable to load tasks.')).not.toBeVisible()

  await page.getByLabel('Task description').fill(description)
  await page.getByRole('button', { name: 'Quick add task' }).click()

  await expect(page.getByText(description)).toBeVisible()
})

test('delete workflow supports cancel, scoped error, and retry success', async ({ page }) => {
  const todos: TodoApiItem[] = [
    {
      id: 1,
      description: 'Retry delete task',
      is_completed: false,
      created_at: '2026-03-06T15:10:01.000Z',
    },
    {
      id: 2,
      description: 'Keep task',
      is_completed: false,
      created_at: '2026-03-06T15:10:02.000Z',
    },
  ]
  let deleteAttemptCount = 0

  await page.route(/\/todos(?:\/\d+)?(?:\?.*)?$/, async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: todos }),
      })
      return
    }

    if (route.request().method() === 'DELETE') {
      const todoId = Number(route.request().url().split('/').pop())

      if (todoId === 1) {
        deleteAttemptCount += 1

        if (deleteAttemptCount === 1) {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({
              error: {
                code: 'TODO_DELETE_FAILED',
                message: 'Delete failed for selected task.',
                details: [],
                request_id: 'req-delete-1',
              },
            }),
          })
          return
        }

        const todoIndex = todos.findIndex((item) => item.id === todoId)
        if (todoIndex >= 0) {
          todos.splice(todoIndex, 1)
        }

        await route.fulfill({
          status: 204,
          body: '',
        })
        return
      }

      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            code: 'TODO_NOT_FOUND',
            message: 'Todo not found',
            details: [],
            request_id: 'req-delete-not-found',
          },
        }),
      })
      return
    }

    await route.fallback()
  })

  await page.goto('/')

  await expect(page.getByText('Retry delete task')).toBeVisible()
  await expect(page.getByText('Keep task')).toBeVisible()

  await page.getByRole('button', { name: 'Delete task "Retry delete task"' }).click()
  await page.getByRole('button', { name: 'Cancel delete task "Retry delete task"' }).click()

  await expect(page.getByRole('button', { name: 'Delete task "Retry delete task"' })).toBeVisible()
  await expect(page.getByText('Retry delete task')).toBeVisible()
  await expect(page.getByText('Keep task')).toBeVisible()
  await expect(page.getByText('Delete failed for selected task.')).not.toBeVisible()

  await page.getByRole('button', { name: 'Delete task "Retry delete task"' }).click()
  await page.getByRole('button', { name: 'Confirm delete task "Retry delete task"' }).click()

  await expect(page.getByText('Delete failed for selected task.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Retry delete task "Retry delete task"' })).toBeVisible()
  await expect(page.getByText('Retry delete task')).toBeVisible()

  await page.getByRole('button', { name: 'Retry delete task "Retry delete task"' }).click()

  await expect(page.getByText('Retry delete task')).not.toBeVisible()
  await expect(page.getByText('Keep task')).toBeVisible()
  await expect(page.getByText('Delete failed for selected task.')).not.toBeVisible()
})

test('mutation failure then retry success reconciles after reload to persisted backend truth', async ({ page }) => {
  const todos: TodoApiItem[] = [
    {
      id: 1,
      description: 'Retry then reload task',
      is_completed: false,
      created_at: '2026-03-06T15:30:01.000Z',
    },
    {
      id: 2,
      description: 'Unaffected persisted task',
      is_completed: false,
      created_at: '2026-03-06T15:30:02.000Z',
    },
  ]
  let toggleAttemptCount = 0

  await page.route(/\/todos(?:\/\d+)?(?:\?.*)?$/, async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: todos }),
      })
      return
    }

    if (route.request().method() === 'PATCH') {
      const todoId = Number(route.request().url().split('/').pop())
      const updateBody = route.request().postDataJSON() as { is_completed: boolean }

      if (todoId !== 1) {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            error: {
              code: 'TODO_NOT_FOUND',
              message: 'Todo not found',
              details: [],
              request_id: 'req-reconcile-not-found',
            },
          }),
        })
        return
      }

      toggleAttemptCount += 1
      if (toggleAttemptCount === 1) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: {
              code: 'TODO_UPDATE_FAILED',
              message: 'Toggle failed once.',
              details: [],
              request_id: 'req-reconcile-toggle-1',
            },
          }),
        })
        return
      }

      const todo = todos.find((item) => item.id === todoId)!
      todo.is_completed = updateBody.is_completed

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: todo }),
      })
      return
    }

    await route.fallback()
  })

  await page.goto('/')

  await expect(page.getByText('Retry then reload task')).toBeVisible()
  await expect(page.getByText('Unaffected persisted task')).toBeVisible()

  await page.getByRole('button', { name: 'Mark task "Retry then reload task" as complete' }).click()
  await expect(page.getByText('Toggle failed once.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Retry toggle task "Retry then reload task"' })).toBeVisible()

  await page.getByRole('button', { name: 'Retry toggle task "Retry then reload task"' }).click()
  await expect(page.getByRole('button', { name: 'Mark task "Retry then reload task" as active' })).toBeVisible()
  await expect(page.getByText('Toggle failed once.')).not.toBeVisible()

  await page.reload()

  await expect(page.getByText('Retry then reload task')).toBeVisible()
  await expect(page.getByText('Unaffected persisted task')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Mark task "Retry then reload task" as active' })).toBeVisible()
  await expect(page.getByText('Toggle failed once.')).not.toBeVisible()
})
