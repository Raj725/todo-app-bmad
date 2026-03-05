import { render, screen } from '@testing-library/react'

import App from './App'

describe('App shell', () => {
  it('renders baseline task shell content', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Todo App' })).toBeInTheDocument()
    expect(screen.getByText('Task experience shell is ready.')).toBeInTheDocument()
  })
})
