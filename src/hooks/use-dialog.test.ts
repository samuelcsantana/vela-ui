import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useDialog } from './use-dialog';

describe('useDialog', () => {
  it('returns a dialogRef and overlayProps', () => {
    const { result } = renderHook(() => useDialog({ isOpen: false, onClose: () => {} }));

    expect(result.current.dialogRef).toBeDefined();
    expect(result.current.overlayProps.role).toBe('presentation');
    expect(result.current.overlayProps.className).toContain('bg-slate-950/60');
  });

  it('locks body scroll when open and restores on unmount', () => {
    const previousOverflow = document.body.style.overflow;

    const { unmount } = renderHook(() => useDialog({ isOpen: true, onClose: () => {} }));

    expect(document.body.style.overflow).toBe('hidden');

    unmount();

    expect(document.body.style.overflow).toBe(previousOverflow || '');
  });

  it('does not lock body scroll when closed', () => {
    const previousOverflow = document.body.style.overflow;

    renderHook(() => useDialog({ isOpen: false, onClose: () => {} }));

    expect(document.body.style.overflow).toBe(previousOverflow || '');
  });
});
