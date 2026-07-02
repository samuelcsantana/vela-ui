import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// Every documented error response in swagger.json is shaped { error: string }.
export function getApiErrorMessage(error: unknown): string | undefined {
  if (axios.isAxiosError(error)) {
    return (error.response?.data as { error?: string } | undefined)?.error;
  }

  return undefined;
}
