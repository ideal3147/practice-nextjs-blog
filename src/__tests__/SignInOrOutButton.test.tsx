import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SignInOrOutButton from '../components/SignInOrOutButton';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

jest.mock('@/utils/supabase/client', () => ({
    createClient: jest.fn(),
}));

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

describe('SignInOrOutButton', () => {
    const mockPush = jest.fn();
    const mockSignOut = jest.fn();
    const mockGetUser = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (createClient as jest.Mock).mockReturnValue({
            auth: {
                getUser: mockGetUser,
                signOut: mockSignOut,
            },
        });
        (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    });

    it('renders Sign In button when user is not logged in', async () => {
        mockGetUser.mockResolvedValue({ data: { user: null } });

        render(<SignInOrOutButton />);

        await waitFor(() => {
            expect(screen.getByText('Sign In')).toBeInTheDocument();
            expect(screen.getByText('Sign Up')).toBeInTheDocument();
        });
    });

    it('renders Sign Out button when user is logged in', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: '123' } } });

        render(<SignInOrOutButton />);

        await waitFor(() => {
            expect(screen.getByText('Sign Out')).toBeInTheDocument();
        });
    });

    it('navigates to /login when Sign In button is clicked', async () => {
        mockGetUser.mockResolvedValue({ data: { user: null } });

        render(<SignInOrOutButton />);

        await waitFor(() => {
            fireEvent.click(screen.getByText('Sign In'));
        });

        expect(mockPush).toHaveBeenCalledWith('/login');
    });

    it('signs out and navigates to /login when Sign Out button is clicked', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: '123' } } });

        render(<SignInOrOutButton />);

        await waitFor(() => {
            fireEvent.click(screen.getByText('Sign Out'));
        });

        expect(mockSignOut).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith('/login');
    });
});