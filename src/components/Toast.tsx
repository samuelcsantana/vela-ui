import { useEffect } from 'react';
import { useToastStore } from '../store/toast-store';

const AUTO_DISMISS_MS = 4000;

export const Toast = () => {
  const message = useToastStore((state) => state.message);
  const clear = useToastStore((state) => state.clear);

  useEffect(() => {
    if (!message) {
      return;
    }

    const timer = setTimeout(clear, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [message, clear]);

  if (!message) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-foreground px-4 py-3 text-sm font-medium text-background shadow-lg"
    >
      {message}
    </div>
  );
};
