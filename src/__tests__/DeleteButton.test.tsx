import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import DeleteButton from '../components/DeleteButton'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

jest.mock('@/utils/supabase/client', () => ({
    createClient: jest.fn(),
}))

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}))

describe('DeleteButton', () => {
    const mockUser = { id: '123', email: 'test@example.com' }
    const mockFetch = jest.fn()
    const mockRedirect = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
        ;(createClient as jest.Mock).mockReturnValue({
            auth: {
                getUser: jest.fn().mockResolvedValue({ data: { user: mockUser } }),
            },
        })
        ;(useRouter as jest.Mock).mockReturnValue({ push: mockRedirect })
        global.fetch = mockFetch
    })

    it('renders the button when user is logged in', async () => {
        render(<DeleteButton slug="test-slug" />)

        await waitFor(() => {
            expect(screen.getByText('削除')).toBeInTheDocument()
        })
    })

    it('does not render the button when user is not logged in', async () => {
        ;(createClient as jest.Mock).mockReturnValue({
            auth: {
                getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
            },
        })

        render(<DeleteButton slug="test-slug" />)

        await waitFor(() => {
            expect(screen.queryByText('削除')).not.toBeInTheDocument()
        })
    })

    it('shows confirmation dialog and deletes the post on confirmation', async () => {
        mockFetch.mockResolvedValueOnce({ ok: true })
        window.confirm = jest.fn().mockReturnValue(true)
        render(<DeleteButton slug="test-slug" />)

        await waitFor(() => {
            expect(screen.getByText('削除')).toBeInTheDocument()
        })

        fireEvent.click(screen.getByText('削除'))

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith('/api/posts/test-slug', { method: 'DELETE' })
            expect(mockRedirect).toHaveBeenCalledWith('/')
        })
    })

    it('does not delete the post if confirmation is canceled', async () => {
        window.confirm = jest.fn().mockReturnValue(false)
        render(<DeleteButton slug="test-slug" />)

        await waitFor(() => {
            expect(screen.getByText('削除')).toBeInTheDocument()
        })

        fireEvent.click(screen.getByText('削除'))

        await waitFor(() => {
            expect(mockFetch).not.toHaveBeenCalled()
            expect(mockRedirect).not.toHaveBeenCalled()
        })
    })

    it('shows an alert if deletion fails', async () => {
        mockFetch.mockResolvedValueOnce({ ok: false })
        window.confirm = jest.fn().mockReturnValue(true)
        window.alert = jest.fn()
        render(<DeleteButton slug="test-slug" />)

        await waitFor(() => {
            expect(screen.getByText('削除')).toBeInTheDocument()
        })

        fireEvent.click(screen.getByText('削除'))

        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith('記事の削除に失敗しました。')
        })
    })
})