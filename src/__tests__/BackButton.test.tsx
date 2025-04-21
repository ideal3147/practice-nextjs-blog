import { render, screen, fireEvent } from '@testing-library/react';
import BackButton from '../components/BackButton';

// useRouter のモック
const pushMock = jest.fn();
const backMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    back: backMock,
  }),
}));

describe('BackButton', () => {
  beforeEach(() => {
    pushMock.mockClear();
    backMock.mockClear();
  });

  it('renders correctly with default label', () => {
    render(<BackButton />);
    expect(screen.getByText('Back')).toBeInTheDocument();
  });

  it('calls router.back when href is not provided', () => {
    render(<BackButton />);
    const link = screen.getByRole('link');
    fireEvent.click(link);
    expect(backMock).toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('calls router.push when href is provided', () => {
    render(<BackButton href="/test" />);
    const link = screen.getByRole('link');
    fireEvent.click(link);
    expect(pushMock).toHaveBeenCalledWith('/test');
    expect(backMock).not.toHaveBeenCalled();
  });

  it('prevents default anchor behavior', () => {
    render(<BackButton />);
    const link = screen.getByRole('link');
  
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    });
  
    // preventDefault をモックする
    jest.spyOn(clickEvent, 'preventDefault');
  
    link.dispatchEvent(clickEvent);
  
    expect(clickEvent.preventDefault).toHaveBeenCalled();
  });
  
});
