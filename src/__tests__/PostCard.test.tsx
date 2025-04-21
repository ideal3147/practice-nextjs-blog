import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import PostCard from '../components/PostCard';
import { PostItem } from '@/app/lib/types/types';

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

jest.mock('@/utils/timestamp', () => ({
    formatDate: jest.fn((date) => `Formatted: ${date}`),
}));

describe('PostCard', () => {
    const mockPush = jest.fn();
    const mockPost: PostItem = {
        slug: 'test-post',
        title: 'Test Post',
        date: '2023-01-01',
        image: 'https://via.placeholder.com/150',
        tags: ['tag1', 'tag2'],
        contentHtml: ''
    };

    beforeEach(() => {
        (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
        jest.clearAllMocks();
    });

    it('renders the post title, date, and image', () => {
        render(<PostCard post={mockPost} />);

        expect(screen.getByText('Test Post')).toBeInTheDocument();
        expect(screen.getByText('Formatted: 2023-01-01')).toBeInTheDocument();
        expect(screen.getByAltText('Test Post')).toBeInTheDocument();
    });

    it('renders "No Image" when no image is provided', () => {
        const postWithoutImage = { ...mockPost, image: null };
        render(<PostCard post={postWithoutImage} />);

        expect(screen.getByText('No Image')).toBeInTheDocument();
    });

    it('navigates to the post page when the card is clicked', () => {
        render(<PostCard post={mockPost} />);

        fireEvent.click(screen.getByText('Test Post'));
        expect(mockPush).toHaveBeenCalledWith('/posts/test-post');
    });

    it('renders tags and navigates to the tag page when a tag is clicked', () => {
        render(<PostCard post={mockPost} />);

        const tagElement = screen.getByText('#tag1');
        expect(tagElement).toBeInTheDocument();

        fireEvent.click(tagElement);
        expect(mockPush).toHaveBeenCalledWith('/tags/tag1');
    });

    it('prevents card navigation when a tag is clicked', () => {
        render(<PostCard post={mockPost} />);

        const tagElement = screen.getByText('#tag1');
        fireEvent.click(tagElement);

        expect(mockPush).toHaveBeenCalledWith('/tags/tag1');
        expect(mockPush).not.toHaveBeenCalledWith('/posts/test-post');
    });
});