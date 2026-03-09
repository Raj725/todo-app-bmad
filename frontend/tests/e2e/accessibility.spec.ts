import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

type TodoApiItem = {
  id: number
  description: string
  is_completed: boolean
  created_at: string
}

test.describe('Accessibility baseline', () => {
  test('keyboard-only user can create, toggle, and delete todos in logical tab order', async ({ page }, testInfo) => {
    if (testInfo.project.name.includes('Mobile') || testInfo.project.name.includes('Safari')) {
      test.skip(true, 'Keyboard tab order checks are validated in desktop Chromium/Firefox in this suite.')
    }

    const todos: TodoApiItem[] = []
    let nextId = 1
    let failedToggleInjected = false
    let deleteAttemptCount = 0

    const tabToElement = async (accessibleName: string) => {
      for (let attempt = 0; attempt < 30; attempt += 1) {
        await page.keyboard.press('Tab')
        const target = page.getByRole('button', { name: accessibleName })
        if (await target.evaluate((node) => node === document.activeElement)) {
          return target
        }
      }

      throw new Error(`Could not focus expected element via Tab: ${accessibleName}`)
    }

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
          created_at: `2026-03-09T10:00:0${nextId}.000Z`,
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
        const todoId = Number(route.request().url().split('/').pop())
        const updateBody = route.request().postDataJSON() as { is_completed: boolean }
        const todo = todos.find((item) => item.id === todoId)

        if (!todo) {
          await route.fulfill({
            status: 404,
            contentType: 'application/json',
            body: JSON.stringify({ error: { message: 'Todo not found' } }),
          })
          return
        }

        if (!updateBody.is_completed && !failedToggleInjected) {
          failedToggleInjected = true
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({
              error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'toggle failed',
                details: [],
                request_id: 'a11y-toggle-retry-1',
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

      if (route.request().method() === 'DELETE') {
        const todoId = Number(route.request().url().split('/').pop())
        const targetIndex = todos.findIndex((item) => item.id === todoId)

        deleteAttemptCount += 1
        if (deleteAttemptCount === 1) {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({
              error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'delete failed',
                details: [],
                request_id: 'a11y-delete-retry-1',
              },
            }),
          })
          return
        }

        if (targetIndex >= 0) {
          todos.splice(targetIndex, 1)
        }

        await route.fulfill({
          status: 204,
          contentType: 'application/json',
          body: '',
        })
        return
      }

      await route.fallback()
    })

    await page.goto('/')

    await page.keyboard.press('Tab')
    await expect(page.getByLabel('Task description')).toBeFocused()

    await page.keyboard.type('Keyboard flow task')
    await tabToElement('Quick add task')

    await page.keyboard.press('Enter')
    await expect(page.getByText('Keyboard flow task')).toBeVisible()

    await tabToElement('Mark task "Keyboard flow task" as complete')
    await page.keyboard.press(' ')
    await expect(page.getByRole('button', { name: 'Mark task "Keyboard flow task" as active' })).toBeVisible()

    await tabToElement('Mark task "Keyboard flow task" as active')
    await page.keyboard.press('Enter')
    await expect(page.getByRole('button', { name: 'Mark task "Keyboard flow task" as active' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Retry toggle task "Keyboard flow task"' })).toBeVisible()

    const retryToggleButton = page.getByRole('button', { name: 'Retry toggle task "Keyboard flow task"' })
    await retryToggleButton.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('button', { name: 'Mark task "Keyboard flow task" as complete' })).toBeVisible()

    await tabToElement('Delete task "Keyboard flow task"')
    await page.keyboard.press(' ')

    const confirmDeleteButton = page.getByRole('button', {
      name: 'Confirm delete task "Keyboard flow task"',
    })
    await expect(confirmDeleteButton).toBeVisible()
    await confirmDeleteButton.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('button', { name: 'Retry delete task "Keyboard flow task"' })).toBeVisible()

    const retryDeleteButton = page.getByRole('button', { name: 'Retry delete task "Keyboard flow task"' })
    await retryDeleteButton.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('listitem').filter({ hasText: 'Keyboard flow task' })).toHaveCount(0)
  })

  test('passes automated axe checks in empty and populated states', async ({ page }) => {
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
          created_at: `2026-03-09T10:05:0${nextId}.000Z`,
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

      await route.fallback()
    })

    await page.goto('/')

    const emptyResults = await new AxeBuilder({ page }).analyze()
    expect(emptyResults.violations.filter((violation) => violation.impact === 'critical')).toHaveLength(0)
    expect(emptyResults.violations.filter((violation) => violation.id === 'color-contrast')).toHaveLength(0)

    await page.getByLabel('Task description').fill('Axe state task')
    await page.getByRole('button', { name: 'Quick add task' }).click()
    await expect(page.getByText('Axe state task')).toBeVisible()

    const populatedResults = await new AxeBuilder({ page }).analyze()
    expect(populatedResults.violations.filter((violation) => violation.impact === 'critical')).toHaveLength(0)
    expect(populatedResults.violations.filter((violation) => violation.id === 'color-contrast')).toHaveLength(0)
  })
})
