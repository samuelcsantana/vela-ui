import { beforeEach, describe, expect, it } from 'vitest';
import { useToastStore } from './toast-store';

describe('useToastStore', () => {
  beforeEach(() => {
    useToastStore.setState({ message: null });
  });

  it('defaults to no message', () => {
    expect(useToastStore.getState().message).toBeNull();
  });

  it('shows a message', () => {
    useToastStore.getState().showToast('Account created successfully.');
    expect(useToastStore.getState().message).toBe('Account created successfully.');
  });

  it('clears the message', () => {
    useToastStore.getState().showToast('Account created successfully.');
    useToastStore.getState().clear();
    expect(useToastStore.getState().message).toBeNull();
  });
});
