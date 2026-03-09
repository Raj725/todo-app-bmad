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
  const createPromise = page.waitForResponse(
    (resp) => resp.url().includes('/todos') && resp.request().method() === 'POST' && resp.status() === 201,
  )
  await page.getByRole('button', { name: 'Quick add task' }).click()
  await createPromise

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

  await page.waitForTimeout(100)
  await page.getByRole('button', { name: 'Mark task "Should still work" as complete' }).click()
  await expect(page.getByRole('button', { name: 'Mark task "Should still work" as active' })).toBeVisible()

  await page.getByRole('button', { name: 'Retry toggle task "Will fail toggle"' }).click()
  await expect(page.getByRole('button', { name: 'Mark task "Will fail toggle" as active' })).toBeVisible()
  await expect(page.getByText('Toggle failed for first task.')).not.toBeVisible()
})

test('real backend integration works without CORS errors', async ({ page }) => {
  const description = `CORS integration task ${Date.now()}`
  const corsFailureMessages: string[] = []

  page.on('requestfailed', (request) => {
    if (!request.url().includes('127.0.0.1:8000')) {
      return
    }

    const errorText = request.failure()?.errorText ?? ''
    if (/cors|cross-origin|blocked by client/i.test(errorText)) {
      corsFailureMessages.push(errorText)
    }
  })

  const initialLoadResponsePromise = page.waitForResponse((response) => {
    return response.url().endsWith('/todos') && response.request().method() === 'GET'
  })

  await page.goto('/')
  const initialLoadResponse = await initialLoadResponsePromise

  await expect(page.getByRole('heading', { name: 'Todo App' })).toBeVisible()
  expect(initialLoadResponse.ok()).toBeTruthy()
  await expect(page.getByText('Unable to load tasks.')).not.toBeVisible()

  const createResponsePromise = page.waitForResponse((response) => {
    return response.url().endsWith('/todos') && response.request().method() === 'POST'
  })

  await page.getByLabel('Task description').fill(description)
  await page.getByRole('button', { name: 'Quick add task' }).click()
  const createResponse = await createResponsePromise

  expect(createResponse.ok()).toBeTruthy()
  await expect(page.getByText(description)).toBeVisible()
  expect(corsFailureMessages).toEqual([])
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
  await page.waitForTimeout(100)
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

test('inline edit failure is scoped and retry persists updated description', async ({ page }) => {
  const todos: TodoApiItem[] = [
    {
      id: 1,
      description: 'Edit retry target',
      is_completed: false,
      created_at: '2026-03-06T16:00:01.000Z',
    },
    {
      id: 2,
      description: 'Unrelated task',
      is_completed: false,
      created_at: '2026-03-06T16:00:02.000Z',
    },
  ]
  let editAttemptCount = 0

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
      const updateBody = route.request().postDataJSON() as { description?: string; is_completed?: boolean }
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
              request_id: 'req-edit-not-found',
            },
          }),
        })
        return
      }

      if (todoId === 1 && typeof updateBody.description === 'string') {
        editAttemptCount += 1
        if (editAttemptCount === 1) {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({
              error: {
                code: 'TODO_UPDATE_FAILED',
                message: 'Edit failed once.',
                details: [],
                request_id: 'req-edit-fail-1',
              },
            }),
          })
          return
        }

        todo.description = updateBody.description
      }

      if (typeof updateBody.is_completed === 'boolean') {
        todo.is_completed = updateBody.is_completed
      }

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

  await expect(page.getByText('Edit retry target')).toBeVisible()
  await expect(page.getByText('Unrelated task')).toBeVisible()

  await page.getByRole('button', { name: 'Edit task "Edit retry target"' }).click()
  await page.getByLabel('Edit description for task "Edit retry target"').fill('Edited successfully after retry')
  await page.getByRole('button', { name: 'Save' }).click()

  await expect(page.getByText('Edit failed once.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Retry edit task "Edit retry target"' })).toBeVisible()
  await expect(page.getByText('Unrelated task')).toBeVisible()

  await page.getByRole('button', { name: 'Retry edit task "Edit retry target"' }).click()

  await expect(page.getByText('Edited successfully after retry')).toBeVisible()
  await expect(page.getByText('Edit failed once.')).not.toBeVisible()

  await page.reload()

  await expect(page.getByText('Edited successfully after retry')).toBeVisible()
  await expect(page.getByText('Unrelated task')).toBeVisible()
  await expect(page.getByText('Edit failed once.')).not.toBeVisible()
})

test('real backend reload shows only confirmed persistence and drops failed optimistic create state', async ({ page }) => {
  const failedDescription = `Transient failure ${Date.now()}`
  const persistedDescription = `Persisted after reload ${Date.now()}`
  let failedInterceptUsed = false

  await page.route(/\/todos(?:\?.*)?$/, async (route) => {
    const isCreate = route.request().method() === 'POST'
    if (!isCreate || failedInterceptUsed) {
      await route.fallback()
      return
    }

    const requestBody = route.request().postDataJSON() as { description?: unknown }
    if (requestBody.description !== failedDescription) {
      await route.fallback()
      return
    }

    failedInterceptUsed = true
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({
        error: {
          code: 'TODO_CREATE_FAILED',
          message: 'Create failed once.',
          details: [],
          request_id: 'req-create-failed-once',
        },
      }),
    })
  })

  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Todo App' })).toBeVisible()

  await page.getByLabel('Task description').fill(failedDescription)
  await page.getByRole('button', { name: 'Quick add task' }).click()
  await expect(page.getByText('Create failed once.')).toBeVisible()
  await expect(page.getByText(failedDescription)).not.toBeVisible()

  await page.getByLabel('Task description').fill(persistedDescription)
  await page.getByRole('button', { name: 'Quick add task' }).click()
  await expect(page.getByText(persistedDescription)).toBeVisible()
  await expect(page.getByText('Create failed once.')).not.toBeVisible()

  await page.reload()

  await expect(page.getByText(persistedDescription)).toBeVisible()
  await expect(page.getByText(failedDescription)).not.toBeVisible()
  await expect(page.getByText('Create failed once.')).not.toBeVisible()
})

test('pagination controls support pointer and keyboard navigation across larger task lists', async ({ page }) => {
  const todos: TodoApiItem[] = Array.from({ length: 31 }, (_, index) => {
    const id = index + 1
    return {
      id,
      description: `Paginated task ${id}`,
      is_completed: false,
      created_at: `2026-03-06T17:00:${String(id).padStart(2, '0')}.000Z`,
    }
  })

  await page.route(/\/todos(?:\/\d+)?(?:\?.*)?$/, async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: todos }),
      })
      return
    }

    await route.fallback()
  })

  await page.goto('/')

  await expect(page.getByText('Page 1 of 2')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Previous page' })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Next page' })).toBeEnabled()

  await page.getByRole('button', { name: 'Next page' }).hover()
  await page.getByRole('button', { name: 'Next page' }).focus()
  await page.keyboard.press('Enter')

  await expect(page.getByText('Page 2 of 2')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Next page' })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Previous page' })).toBeEnabled()

  await page.getByRole('button', { name: 'Previous page' }).click()
  await expect(page.getByText('Page 1 of 2')).toBeVisible()
})
