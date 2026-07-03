import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserFilters } from './UserFilters';

const { mockNavigate, mockUseSearch } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockUseSearch: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  useSearch: () => mockUseSearch(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('UserFilters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSearch.mockReturnValue({ search: undefined, page: 1 });
  });

  it('renders with the current search term from the URL', () => {
    mockUseSearch.mockReturnValue({ search: 'ana', page: 1 });
    render(<UserFilters />);

    expect(screen.getByLabelText('users.search.label')).toHaveValue('ana');
  });

  it('does not navigate on the initial render', () => {
    render(<UserFilters />);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('navigates with the debounced, trimmed search term and resets the page', async () => {
    render(<UserFilters />);
    const input = screen.getByLabelText('users.search.label');

    fireEvent.change(input, { target: { value: '  ana  ' } });

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledTimes(1));
    const [{ search: updater, replace }] = mockNavigate.mock.calls[0];
    expect(replace).toBe(true);
    expect(updater({ page: 3 })).toEqual({ page: 1, search: 'ana' });
  });

  it('sends undefined instead of an empty string when the search is cleared', async () => {
    render(<UserFilters />);
    const input = screen.getByLabelText('users.search.label');

    fireEvent.change(input, { target: { value: '   ' } });

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledTimes(1));
    const [{ search: updater }] = mockNavigate.mock.calls[0];
    expect(updater({}).search).toBeUndefined();
  });

  it('shows a validation error and marks the field invalid past the character limit', async () => {
    const user = userEvent.setup();
    render(<UserFilters />);

    const input = screen.getByLabelText('users.search.label');
    await user.type(input, 'a'.repeat(101));

    const error = await screen.findByText('users.validation.searchTooLong');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'users-search-error');
    expect(error).toBeInTheDocument();
  });
});
