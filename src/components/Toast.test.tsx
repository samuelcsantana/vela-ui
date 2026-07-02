import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useToastStore } from '../store/toast-store';
import { Toast } from './Toast';

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useToastStore.setState({ message: null });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing when there is no message', () => {
    const { container } = render(<Toast />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the message when set', () => {
    useToastStore.setState({ message: 'Account created successfully.' });
    render(<Toast />);

    expect(screen.getByRole('status')).toHaveTextContent('Account created successfully.');
  });

  it('auto-dismisses the message after the timeout', () => {
    useToastStore.setState({ message: 'Account created successfully.' });
    render(<Toast />);

    expect(screen.getByRole('status')).toBeInTheDocument();

    vi.advanceTimersByTime(4000);

    expect(useToastStore.getState().message).toBeNull();
  });
});
