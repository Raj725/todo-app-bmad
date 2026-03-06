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
            json: async () => ({ error: { message: 'validation failed' } }),
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

    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to create task.')

    fireEvent.click(screen.getByRole('button', { name: 'Retry quick add' }))

    await waitFor(() => {
      expect(screen.getByText('Retry task')).toBeInTheDocument()
    })

    expect(createAttemptCount).toBe(2)
  })
})
