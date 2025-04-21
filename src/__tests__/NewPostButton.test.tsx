import { render, screen, waitFor } from '@testing-library/react'
import NewPostButton from '../components/NewPostButton'
import { createClient } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js'
import '@testing-library/jest-dom'

// Mock dependencies
jest.mock('@/utils/supabase/client', () => ({
    createClient: jest.fn(),
}))

jest.mock('next/link', () => ({
    __esModule: true,
    default: ({ href, children }: { href: string; children: React.ReactNode }) => (
        <a href={href}>{children}</a>
    ),
}))

describe('NewPostButton', () => {
    it('renders nothing if no user is logged in', async () => {
        const mockAuth = {
            auth: {
                getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
            },
        }
        ;(createClient as jest.Mock).mockReturnValue(mockAuth)

        render(<NewPostButton />)

        await waitFor(() => {
            expect(screen.queryByRole('link')).not.toBeInTheDocument()
        })
    })

    it('renders the button if a user is logged in', async () => {
        const mockUser: User = { id: '123', email: 'test@example.com' } as User
        const mockAuth = {
            auth: {
                getUser: jest.fn().mockResolvedValue({ data: { user: mockUser } }),
            },
        }
        ;(createClient as jest.Mock).mockReturnValue(mockAuth)

        render(<NewPostButton />)

        await waitFor(() => {
            expect(screen.getByRole('link', { name: /新規記事を作成/i })).toBeInTheDocument()
        })
    })
})