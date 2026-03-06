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

  await page.route('**/todos', async (route) => {
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
