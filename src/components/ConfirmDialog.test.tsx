import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDialog } from './ConfirmDialog';

const BASE_PROPS = {
  title: 'Are you absolutely sure?',
  description: 'This action cannot be undone.',
  confirmLabel: 'Delete',
  cancelLabel: 'Cancel',
};

describe('ConfirmDialog', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <ConfirmDialog {...BASE_PROPS} isOpen={false} onConfirm={vi.fn()} onCancel={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the dialog with the title and description, and focuses cancel first', async () => {
    render(<ConfirmDialog {...BASE_PROPS} isOpen onConfirm={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByRole('alertdialog', { name: BASE_PROPS.title })).toHaveAccessibleDescription(
      BASE_PROPS.description,
    );
    await waitFor(() => expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus());
  });

  it('locks body scroll while open and restores it on close', () => {
    const { rerender } = render(<ConfirmDialog {...BASE_PROPS} isOpen onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(document.body.style.overflow).toBe('hidden');

    rerender(<ConfirmDialog {...BASE_PROPS} isOpen={false} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(document.body.style.overflow).toBe('');
  });

  it('restores focus to the previously focused element on close', async () => {
    const trigger = document.createElement('button');
    trigger.textContent = 'open';
    document.body.appendChild(trigger);
    trigger.focus();

    const { rerender } = render(<ConfirmDialog {...BASE_PROPS} isOpen onConfirm={vi.fn()} onCancel={vi.fn()} />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus());

    rerender(<ConfirmDialog {...BASE_PROPS} isOpen={false} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(trigger).toHaveFocus();

    trigger.remove();
  });

  it('calls onCancel when clicking the cancel button, the backdrop, or pressing Escape', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<ConfirmDialog {...BASE_PROPS} isOpen onConfirm={vi.fn()} onCancel={onCancel} />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);

    rerender(<ConfirmDialog {...BASE_PROPS} isOpen onConfirm={vi.fn()} onCancel={onCancel} />);
    await user.click(screen.getByRole('alertdialog').parentElement as HTMLElement);
    expect(onCancel).toHaveBeenCalledTimes(2);

    rerender(<ConfirmDialog {...BASE_PROPS} isOpen onConfirm={vi.fn()} onCancel={onCancel} />);
    await user.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledTimes(3);
  });

  it('does not close when clicking inside the dialog panel', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    render(<ConfirmDialog {...BASE_PROPS} isOpen onConfirm={vi.fn()} onCancel={onCancel} />);

    await user.click(screen.getByRole('alertdialog'));
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('calls onConfirm when clicking the confirm button', async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    render(<ConfirmDialog {...BASE_PROPS} isOpen onConfirm={onConfirm} onCancel={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('traps Tab focus, wrapping from the last to the first focusable element and back', async () => {
    const user = userEvent.setup();
    render(<ConfirmDialog {...BASE_PROPS} isOpen onConfirm={vi.fn()} onCancel={vi.fn()} />);

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    const confirmButton = screen.getByRole('button', { name: 'Delete' });

    confirmButton.focus();
    await user.tab();
    expect(cancelButton).toHaveFocus();

    await user.tab({ shift: true });
    expect(confirmButton).toHaveFocus();
  });

  it('does nothing on Tab when the dialog has no focusable elements', async () => {
    const querySelectorAllSpy = vi.spyOn(Element.prototype, 'querySelectorAll').mockReturnValue([] as never);
    const user = userEvent.setup();
    render(<ConfirmDialog {...BASE_PROPS} isOpen onConfirm={vi.fn()} onCancel={vi.fn()} />);

    await expect(user.tab()).resolves.toBeUndefined();

    querySelectorAllSpy.mockRestore();
  });

  it('disables both buttons while loading', () => {
    render(<ConfirmDialog {...BASE_PROPS} isOpen isLoading onConfirm={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
  });

  it('shows an error message when provided', () => {
    render(
      <ConfirmDialog {...BASE_PROPS} isOpen errorMessage="Something went wrong" onConfirm={vi.fn()} onCancel={vi.fn()} />,
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('applies the destructive style to the confirm button when isDestructive is set', () => {
    render(<ConfirmDialog {...BASE_PROPS} isOpen isDestructive onConfirm={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Delete' })).toHaveClass('bg-red-600');
  });

  it('applies the default brand style to the confirm button when isDestructive is not set', () => {
    render(<ConfirmDialog {...BASE_PROPS} isOpen onConfirm={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Delete' })).toHaveClass('bg-brand');
  });
});
