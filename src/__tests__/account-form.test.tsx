import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AccountForm from '../app/account/account-form'
import { createClient } from '@/utils/supabase/client'
import { redirect } from 'next/navigation'

jest.mock('@/utils/supabase/client', () => ({
  createClient: jest.fn(),
}))

jest.mock('next/navigation', () => ({
    redirect: jest.fn(),
}))

describe('AccountForm', () => {
  const mockUser = {
    id: '123',
    email: 'test@example.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2023-01-01T00:00:00.000Z',
  }

  const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    upsert: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
    // window.location.href のモック
    delete (window as any).location
    ;(window as any).location = { href: '' }
  })

  it('renders the form with user email', async () => {
    mockSupabase.single.mockResolvedValue({ data: null, error: null })
    render(<AccountForm user={mockUser} />)
    expect(screen.getByLabelText(/email/i)).toHaveValue(mockUser.email)
  })

  it('loads user profile on mount', async () => {
    mockSupabase.single.mockResolvedValue({
      data: {
        full_name: 'John Doe',
        username: 'johndoe',
        website: 'https://example.com',
        avatar_url: 'avatar.jpg',
      },
      error: null,
    })

    render(<AccountForm user={mockUser} />)

    await waitFor(() => {
      expect(screen.getByLabelText(/full name/i)).toHaveValue('John Doe')
      expect(screen.getByLabelText(/username/i)).toHaveValue('johndoe')
    })
  })

  it('handles profile update', async () => {
    mockSupabase.single.mockResolvedValue({
      data: {
        full_name: 'John Doe',
        username: 'johndoe',
        website: 'https://example.com',
        avatar_url: 'avatar.jpg',
      },
      error: null,
    })
  
    mockSupabase.upsert.mockResolvedValue({ error: null })
  
    render(<AccountForm user={mockUser} />)
  
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument()
    })
  
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Jane Doe' },
    })
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'janedoe' },
    })
  
    fireEvent.click(screen.getByRole('button', { name: /update/i }))
  
    await waitFor(() => {
      expect(mockSupabase.upsert).toHaveBeenCalledWith({
        id: mockUser.id,
        full_name: 'Jane Doe',
        username: 'janedoe',
        website: 'https://example.com',
        updated_at: expect.any(String),
      })
    })
  })
  

  it('redirects on skip', async () => {
    mockSupabase.single.mockResolvedValue({ data: null, error: null })

    render(<AccountForm user={mockUser} />)

    fireEvent.click(screen.getByText(/skip/i))

    await waitFor(() => {
      expect(redirect).toHaveBeenCalledWith('/')
    })
  })
})
