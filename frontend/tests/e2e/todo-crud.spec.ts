import { expect, test, type Page } from '@playwright/test'

async function goToFirstPage(page: Page) {
  const previousButton = page.getByRole('button', { name: 'Previous page' }).first()
  while ((await previousButton.isVisible().catch(() => false)) && (await previousButton.isEnabled().catch(() => false))) {
    await previousButton.click()
  }
}

async function ensureTaskVisible(page: Page, taskText: string) {
  await goToFirstPage(page)

  const taskLocator = page.locator('.todo-description', { hasText: taskText }).first()
  const nextButton = page.getByRole('button', { name: 'Next page' }).first()

  while (!(await taskLocator.first().isVisible().catch(() => false))) {
    const canGoNext = (await nextButton.isVisible().catch(() => false)) && (await nextButton.isEnabled().catch(() => false))
    if (!canGoNext) {
      break
    }

    await nextButton.click()
  }

  await expect(taskLocator).toBeVisible()
}

test.describe('Todo CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should allow full lifecycle of a todo item', async ({ page }) => {
    const timestamp = Date.now()
    const uniqueId = `${timestamp}-${Math.floor(Math.random() * 10000)}`
    const todoText = `Test Task ${uniqueId}`
    const updatedText = `Updated Task ${uniqueId}`

    // 1. Create a new todo
    await test.step('Create Todo', async () => {
      await page.getByLabel('Task description').fill(todoText)
      await page.getByRole('button', { name: 'Quick add task' }).click()
      
      // Verify it appears in the list
      await expect(page.getByText(todoText)).toBeVisible()
    })

    // 2. Edit description
    await test.step('Edit Todo Description', async () => {
      await ensureTaskVisible(page, todoText)

      // Click Edit button
      await page.getByRole('button', { name: `Edit task "${todoText}"` }).click()
      
      // Fill new description
      const editInput = page.getByLabel(`Edit description for task "${todoText}"`)
      await editInput.fill(updatedText)
      
      // Click Save
      await page.getByRole('button', { name: 'Save' }).click()
      
      // Verify update
      await expect(page.getByText(updatedText)).toBeVisible()
      await expect(page.getByText(todoText)).not.toBeVisible()
    })

    // 3. Mark as completed
    await test.step('Mark as Completed', async () => { 
      await ensureTaskVisible(page, updatedText)

      // Button aria-label changes based on status. Currently active.
      await page.getByRole('button', { name: `Mark task "${updatedText}" as complete` }).click()

      await ensureTaskVisible(page, updatedText)
      
      // Verify button changes to "Mark active"
      await expect(page.getByRole('button', { name: `Mark task "${updatedText}" as active` })).toBeVisible()
      
      // Verify status text in the specific list row for this task.
      const todoRow = page
        .locator('li.todo-row')
        .filter({ has: page.locator('.todo-description', { hasText: updatedText }) })
        .first()
      await expect(todoRow.locator('.todo-status')).toContainText('Completed')
    })

    // 4. Delete the todo
    await test.step('Delete Todo', async () => {
      await ensureTaskVisible(page, updatedText)

        // Click Delete to verify confirmation
        // Wait, after update, the text is updatedText.
        await page.getByRole('button', { name: `Delete task "${updatedText}"` }).click()
        
        // Verify confirmation button appears
        const confirmButton = page.getByRole('button', { name: `Confirm delete task "${updatedText}"` })
        await expect(confirmButton).toBeVisible()
        
        // Click Confirm
        await confirmButton.click()
        
        // Verify it disappears
        await expect(page.getByText(updatedText)).not.toBeVisible()
    })
  })
})
