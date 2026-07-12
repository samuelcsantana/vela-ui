import { useEffect, useState, type ChangeEvent } from 'react';

interface UseImageFileReturn {
  file: File | null;
  previewUrl: string | null;
  handleChange: (event: ChangeEvent<HTMLInputElement>) => void;
  reset: (remoteUrl?: string | null) => void;
}

export function useImageFile(initialUrl?: string | null): UseImageFileReturn {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialUrl ?? null);

  // Sync when initialUrl changes (e.g. editing a different tenant).
  // This resets local state to match the new remote value — a legitimate
  // sync-from-external-source use of useEffect.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setFile(null); setPreviewUrl(initialUrl ?? null); }, [initialUrl]);

  // Revoke blob URLs on unmount or when previewUrl changes.
  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  };

  const reset = (remoteUrl?: string | null) => {
    setFile(null);
    setPreviewUrl(remoteUrl ?? null);
  };

  return { file, previewUrl, handleChange, reset };
}
