import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import App from './App'

function renderWithQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  })

  render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>,
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Task list and quick-add flows', () => {
  const getQuickAddSection = () => screen.getByRole('region', { name: 'Quick add task section' })

  it('renders explicit loading state while list query is pending', () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      () => new Promise<Response>(() => undefined),
    )

    renderWithQueryClient()

    expect(screen.getByRole('heading', { name: 'Todo App' })).toBeInTheDocument()
    expect(screen.getByText('Loading tasks...')).toBeInTheDocument()
    expect(within(getQuickAddSection()).getByRole('button', { name: 'Quick add task' })).toBeInTheDocument()
  })

  it('renders explicit empty state and keeps quick-add visible', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    } as Response)

    renderWithQueryClient()

    expect(await screen.findByText('No tasks yet.')).toBeInTheDocument()
    expect(within(getQuickAddSection()).getByRole('button', { name: 'Quick add task' })).toBeInTheDocument()
  })

  it('renders explicit list load failure state while keeping quick-add visible', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'server error',
          details: [],
          request_id: 'list-err-1',
        },
      }),
    } as Response)

    renderWithQueryClient()

    expect(await screen.findByText('Unable to load tasks.')).toBeInTheDocument()
    expect(within(getQuickAddSection()).getByRole('button', { name: 'Quick add task' })).toBeInTheDocument()
  })

  it('renders populated list with deterministic created timestamp', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          {
            id: 2,
            description: 'Second task',
            is_completed: false,
            created_at: '2026-03-05T10:15:30.000Z',
          },
        ],
      }),
    } as Response)

    renderWithQueryClient()

    expect(await screen.findByText('Second task')).toBeInTheDocument()
    expect(screen.getByText('Created: 2026-03-05T10:15:30.000Z')).toBeInTheDocument()
  })

  it('disables only quick-add submit while create is pending', async () => {
    const deferredCreate = new Promise<Response>(() => undefined)
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input)
      if (url.endsWith('/todos') && init?.method === 'POST') {
        return deferredCreate
      }

      return {
        ok: true,
        json: async () => ({ data: [] }),
      } as Response
    })

    renderWithQueryClient()

    await screen.findByText('No tasks yet.')
    const input = screen.getByLabelText('Task description')
    fireEvent.change(input, { target: { value: 'Write docs' } })
    fireEvent.click(within(getQuickAddSection()).getByRole('button', { name: 'Quick add task' }))

    expect(await screen.findByRole('button', { name: 'Adding task...' })).toBeDisabled()
    expect(screen.queryByText('Loading tasks...')).not.toBeInTheDocument()
  })

  it('shows inline failure and supports retry using last attempted description', async () => {
    let createAttemptCount = 0

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input)
      if (url.endsWith('/todos') && init?.method === 'POST') {
        createAttemptCount += 1

        if (createAttemptCount === 1) {
          return {
            ok: false,
            status: 400,
            json: async () => ({
              error: {
                code: 'VALIDATION_ERROR',
                message: 'validation failed',
                details: [],
                request_id: 'create-err-1',
              },
            }),
          } as Response
        }

        return {
          ok: true,
          json: async () => ({
            data: {
              id: 3,
              description: 'Retry task',
              is_completed: false,
              created_at: '2026-03-06T13:00:00.000Z',
            },
          }),
        } as Response
      }

      if (createAttemptCount >= 2) {
        return {
          ok: true,
          json: async () => ({
            data: [
              {
                id: 3,
                description: 'Retry task',
                is_completed: false,
                created_at: '2026-03-06T13:00:00.000Z',
              },
            ],
          }),
        } as Response
      }

      return {
        ok: true,
        json: async () => ({ data: [] }),
      } as Response
    })

    renderWithQueryClient()

    await screen.findByText('No tasks yet.')

    fireEvent.change(screen.getByLabelText('Task description'), {
      target: { value: 'Retry task' },
    })
    fireEvent.click(within(getQuickAddSection()).getByRole('button', { name: 'Quick add task' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('validation failed')

    fireEvent.click(screen.getByRole('button', { name: 'Retry quick add' }))

    await waitFor(() => {
      expect(screen.getByText('Retry task')).toBeInTheDocument()
    })

    expect(createAttemptCount).toBe(2)
  })

  it('shows newly submitted task immediately before create response resolves', async () => {
    let resolveCreate: ((value: Response) => void) | undefined
    const createResponse = new Promise<Response>((resolve) => {
      resolveCreate = resolve
    })

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input)

      if (url.endsWith('/todos') && init?.method === 'POST') {
        return createResponse
      }

      return {
        ok: true,
        json: async () => ({ data: [] }),
      } as Response
    })

    renderWithQueryClient()

    await screen.findByText('No tasks yet.')

    fireEvent.change(screen.getByLabelText('Task description'), {
      target: { value: 'Immediate task' },
    })
    fireEvent.click(within(getQuickAddSection()).getByRole('button', { name: 'Quick add task' }))

    expect(await screen.findByText('Immediate task')).toBeInTheDocument()

    resolveCreate?.({
      ok: true,
      json: async () => ({
        data: {
          id: 9,
          description: 'Immediate task',
          is_completed: false,
          created_at: '2026-03-06T14:00:00.000Z',
        },
      }),
    } as Response)

    await waitFor(() => {
      expect(screen.getByText('Immediate task')).toBeInTheDocument()
    })
  })

  it('toggles a task to completed with scoped pending state and active-first ordering', async () => {
    let toggleRequested = false

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input)

      if (url.endsWith('/todos') && !init?.method) {
        if (toggleRequested) {
          return {
            ok: true,
            json: async () => ({
              data: [
                {
                  id: 11,
                  description: 'Alpha active',
                  is_completed: true,
                  created_at: '2026-03-06T10:00:00.000Z',
                },
                {
                  id: 12,
                  description: 'Beta active',
                  is_completed: false,
                  created_at: '2026-03-06T09:00:00.000Z',
                },
              ],
            }),
          } as Response
        }

        return {
          ok: true,
          json: async () => ({
            data: [
              {
                id: 11,
                description: 'Alpha active',
                is_completed: false,
                created_at: '2026-03-06T10:00:00.000Z',
              },
              {
                id: 12,
                description: 'Beta active',
                is_completed: false,
                created_at: '2026-03-06T09:00:00.000Z',
              },
            ],
          }),
        } as Response
      }

      if (url.endsWith('/todos/11') && init?.method === 'PATCH') {
        toggleRequested = true
        return {
          ok: true,
          json: async () => ({
            data: {
              id: 11,
              description: 'Alpha active',
              is_completed: true,
              created_at: '2026-03-06T10:00:00.000Z',
            },
          }),
        } as Response
      }

      return {
        ok: true,
        json: async () => ({ data: [] }),
      } as Response
    })

    renderWithQueryClient()

    expect(await screen.findByText('Alpha active')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Mark task "Alpha active" as complete' }))

    await waitFor(() => {
      expect(toggleRequested).toBe(true)
      expect(screen.getByRole('button', { name: 'Mark task "Alpha active" as active' })).toBeInTheDocument()
      expect(screen.getByText('Completed')).toBeInTheDocument()
    })

    const items = screen.getAllByRole('listitem')
    expect(within(items[0]).getByText('Beta active')).toBeInTheDocument()
    expect(within(items[1]).getByText('Alpha active')).toBeInTheDocument()
  })

  it('rolls back optimistic toggle and shows scoped error on update failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input)

      if (url.endsWith('/todos') && !init?.method) {
        return {
          ok: true,
          json: async () => ({
            data: [
              {
                id: 31,
                description: 'Fail toggle task',
                is_completed: false,
                created_at: '2026-03-06T08:00:00.000Z',
              },
              {
                id: 32,
                description: 'Stable task',
                is_completed: false,
                created_at: '2026-03-06T07:00:00.000Z',
              },
            ],
          }),
        } as Response
      }

      if (url.endsWith('/todos/31') && init?.method === 'PATCH') {
        return {
          ok: false,
          status: 500,
          json: async () => ({
            error: {
              code: 'INTERNAL_SERVER_ERROR',
              message: 'update failed',
              details: [],
              request_id: 'toggle-err-1',
            },
          }),
        } as Response
      }

      return {
        ok: true,
        json: async () => ({ data: [] }),
      } as Response
    })

    renderWithQueryClient()

    expect(await screen.findByText('Fail toggle task')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Mark task "Fail toggle task" as complete' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Mark task "Fail toggle task" as complete' })).toBeInTheDocument()
      expect(screen.getByRole('alert')).toHaveTextContent('update failed')
    })

    expect(screen.getByRole('button', { name: 'Mark task "Stable task" as complete' })).toBeInTheDocument()
  })

  it('repositions task back into active section when toggled from completed to active', async () => {
    let toggleRequested = false

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input)

      if (url.endsWith('/todos') && !init?.method) {
        if (toggleRequested) {
          return {
            ok: true,
            json: async () => ({
              data: [
                {
                  id: 61,
                  description: 'Alpha completed',
                  is_completed: false,
                  created_at: '2026-03-06T10:00:00.000Z',
                },
                {
                  id: 62,
                  description: 'Beta active',
                  is_completed: false,
                  created_at: '2026-03-06T09:00:00.000Z',
                },
              ],
            }),
          } as Response
        }

        return {
          ok: true,
          json: async () => ({
            data: [
              {
                id: 61,
                description: 'Alpha completed',
                is_completed: true,
                created_at: '2026-03-06T10:00:00.000Z',
              },
              {
                id: 62,
                description: 'Beta active',
                is_completed: false,
                created_at: '2026-03-06T09:00:00.000Z',
              },
            ],
          }),
        } as Response
      }

      if (url.endsWith('/todos/61') && init?.method === 'PATCH') {
        toggleRequested = true
        return {
          ok: true,
          json: async () => ({
            data: {
              id: 61,
              description: 'Alpha completed',
              is_completed: false,
              created_at: '2026-03-06T10:00:00.000Z',
            },
          }),
        } as Response
      }

      return {
        ok: true,
        json: async () => ({ data: [] }),
      } as Response
    })

    renderWithQueryClient()

    expect(await screen.findByText('Alpha completed')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Mark task "Alpha completed" as active' }))

    await waitFor(() => {
      expect(toggleRequested).toBe(true)
      expect(screen.getByRole('button', { name: 'Mark task "Alpha completed" as complete' })).toBeInTheDocument()
      expect(screen.getAllByText('Active').length).toBeGreaterThan(0)
    })

    const items = screen.getAllByRole('listitem')
    expect(within(items[0]).getByText('Alpha completed')).toBeInTheDocument()
    expect(within(items[1]).getByText('Beta active')).toBeInTheDocument()
  })

  it('supports inline edit save and persists updated description through PATCH', async () => {
    let serverTodos = [
      {
        id: 71,
        description: 'Editable task',
        is_completed: false,
        created_at: '2026-03-06T12:10:00.000Z',
      },
    ]

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input)

      if (url.endsWith('/todos') && !init?.method) {
        return {
          ok: true,
          json: async () => ({ data: serverTodos }),
        } as Response
      }

      if (url.endsWith('/todos/71') && init?.method === 'PATCH') {
        expect(init.body).toBe(JSON.stringify({ description: 'Updated editable task' }))

        serverTodos = [
          {
            ...serverTodos[0],
            description: 'Updated editable task',
          },
        ]

        return {
          ok: true,
          json: async () => ({ data: serverTodos[0] }),
        } as Response
      }

      return {
        ok: true,
        json: async () => ({ data: [] }),
      } as Response
    })

    renderWithQueryClient()

    expect(await screen.findByText('Editable task')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Edit task "Editable task"' }))
    const editInput = screen.getByRole('textbox', { name: 'Edit description for task "Editable task"' })
    fireEvent.change(editInput, { target: { value: 'Updated editable task' } })
    fireEvent.keyDown(editInput, { key: 'Enter' })

    await waitFor(() => {
      expect(screen.getByText('Updated editable task')).toBeInTheDocument()
    })
  })

  it('cancels inline edit without sending PATCH mutation', async () => {
    let patchCalls = 0

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input)

      if (url.endsWith('/todos') && !init?.method) {
        return {
          ok: true,
          json: async () => ({
            data: [
              {
                id: 72,
                description: 'Cancel edit task',
                is_completed: false,
                created_at: '2026-03-06T12:20:00.000Z',
              },
            ],
          }),
        } as Response
      }

      if (url.endsWith('/todos/72') && init?.method === 'PATCH') {
        patchCalls += 1
      }

      return {
        ok: true,
        json: async () => ({ data: [] }),
      } as Response
    })

    renderWithQueryClient()

    expect(await screen.findByText('Cancel edit task')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Edit task "Cancel edit task"' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Edit description for task "Cancel edit task"' }), {
      target: { value: 'Should not persist' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    await waitFor(() => {
      expect(screen.getByText('Cancel edit task')).toBeInTheDocument()
    })
    expect(patchCalls).toBe(0)
  })

  it('shows inline validation feedback for invalid edit input and prevents PATCH request', async () => {
    let patchCalls = 0

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input)

      if (url.endsWith('/todos') && !init?.method) {
        return {
          ok: true,
          json: async () => ({
            data: [
              {
                id: 73,
                description: 'Validate edit task',
                is_completed: false,
                created_at: '2026-03-06T12:30:00.000Z',
              },
            ],
          }),
        } as Response
      }

      if (url.endsWith('/todos/73') && init?.method === 'PATCH') {
        patchCalls += 1
      }

      return {
        ok: true,
        json: async () => ({ data: [] }),
      } as Response
    })

    renderWithQueryClient()

    expect(await screen.findByText('Validate edit task')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Edit task "Validate edit task"' }))

    fireEvent.change(screen.getByRole('textbox', { name: 'Edit description for task "Validate edit task"' }), {
      target: { value: '   ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Task description is required.')
    expect(patchCalls).toBe(0)
  })

  it('rolls back failed inline edit and supports scoped retry', async () => {
    let patchAttempts = 0
    let serverTodos = [
      {
        id: 74,
        description: 'Retry edit task',
        is_completed: false,
        created_at: '2026-03-06T12:40:00.000Z',
      },
    ]

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input)

      if (url.endsWith('/todos') && !init?.method) {
        return {
          ok: true,
          json: async () => ({ data: serverTodos }),
        } as Response
      }

      if (url.endsWith('/todos/74') && init?.method === 'PATCH') {
        patchAttempts += 1

        if (patchAttempts === 1) {
          return {
            ok: false,
            status: 500,
            json: async () => ({
              error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'update failed',
                details: [],
                request_id: 'edit-err-1',
              },
            }),
          } as Response
        }

        serverTodos = [
          {
            ...serverTodos[0],
            description: 'Retry edit task updated',
          },
        ]
        return {
          ok: true,
          json: async () => ({ data: serverTodos[0] }),
        } as Response
      }

      return {
        ok: true,
        json: async () => ({ data: [] }),
      } as Response
    })

    renderWithQueryClient()

    expect(await screen.findByText('Retry edit task')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Edit task "Retry edit task"' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Edit description for task "Retry edit task"' }), {
      target: { value: 'Retry edit task updated' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('update failed')
      expect(screen.getByText('Retry edit task')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Retry edit task "Retry edit task"' }))

    await waitFor(() => {
      expect(screen.getByText('Retry edit task updated')).toBeInTheDocument()
      expect(patchAttempts).toBe(2)
    })
  })

  it('supports delete confirm then cancel without removing the task', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input)

      if (url.endsWith('/todos') && !init?.method) {
        return {
          ok: true,
          json: async () => ({
            data: [
              {
                id: 41,
                description: 'Cancelable delete task',
                is_completed: false,
                created_at: '2026-03-06T11:00:00.000Z',
              },
            ],
          }),
        } as Response
      }

      return { ok: true, status: 204 } as Response
    })

    renderWithQueryClient()

    expect(await screen.findByText('Cancelable delete task')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Delete task "Cancelable delete task"' }))
    expect(screen.getByRole('button', { name: 'Confirm delete task "Cancelable delete task"' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel delete task "Cancelable delete task"' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel delete task "Cancelable delete task"' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Delete task "Cancelable delete task"' })).toBeInTheDocument()
      expect(screen.getByText('Cancelable delete task')).toBeInTheDocument()
    })
  })

  it('shows delete retry affordance after failed confirm and removes task after retry succeeds', async () => {
    let deleteAttemptCount = 0
    let serverTodos = [
      {
        id: 55,
        description: 'Retry delete task',
        is_completed: false,
        created_at: '2026-03-06T12:00:00.000Z',
      },
    ]

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input)

      if (url.endsWith('/todos') && !init?.method) {
        return {
          ok: true,
          json: async () => ({ data: serverTodos }),
        } as Response
      }

      if (url.endsWith('/todos/55') && init?.method === 'DELETE') {
        deleteAttemptCount += 1

        if (deleteAttemptCount === 1) {
          return {
            ok: false,
            status: 500,
            json: async () => ({
              error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'delete failed',
                details: [],
                request_id: 'delete-err-1',
              },
            }),
          } as Response
        }

        serverTodos = []
        return { ok: true, status: 204 } as Response
      }

      return {
        ok: true,
        json: async () => ({ data: [] }),
      } as Response
    })

    renderWithQueryClient()

    expect(await screen.findByText('Retry delete task')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Delete task "Retry delete task"' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirm delete task "Retry delete task"' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Retry delete task "Retry delete task"' })).toBeInTheDocument()
      expect(screen.getByText('Retry delete task')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Retry delete task "Retry delete task"' }))

    await waitFor(() => {
      expect(screen.queryByText('Retry delete task')).not.toBeInTheDocument()
      expect(deleteAttemptCount).toBe(2)
    })
  })
})
