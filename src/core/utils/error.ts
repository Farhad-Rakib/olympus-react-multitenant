import { AxiosError } from 'axios';

// The API's error envelope. Only the field we actually read is declared.
interface ApiErrorBody {
  message?: string;
}

// Replaces the `(err: any) => err?.response?.data?.message || err.message || '...'` chain that was
// repeated ~50 times. `unknown` is the correct type for a caught value; narrowing happens here once
// instead of being skipped at every call site by widening to `any`.
export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  const axiosError = error as AxiosError<ApiErrorBody> | undefined;

  const serverMessage = axiosError?.response?.data?.message;
  if (typeof serverMessage === 'string' && serverMessage.trim() !== '') {
    return serverMessage;
  }

  if (error instanceof Error && error.message.trim() !== '') {
    return error.message;
  }

  return fallback;
};
