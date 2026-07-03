import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from './select';

describe('Select', () => {
  it('renders a group label and separator, and selects an item from within a group', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Select onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Pick one" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Roles</SelectLabel>
            <SelectItem value="ADMIN">ADMIN</SelectItem>
            <SelectSeparator />
            <SelectItem value="MEMBER">MEMBER</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>,
    );

    expect(screen.getByText('Pick one')).toBeInTheDocument();

    await user.click(screen.getByRole('combobox'));

    expect(screen.getByText('Roles')).toBeInTheDocument();
    // The separator is decorative (aria-hidden, no ARIA role) and portaled outside the
    // render container, so it's queried directly off the document rather than by role.
    expect(document.querySelector('[data-slot="select-separator"]')).toBeInTheDocument();

    await user.click(screen.getByRole('option', { name: 'ADMIN' }));
    expect(onValueChange).toHaveBeenCalledWith('ADMIN');
  });
});
