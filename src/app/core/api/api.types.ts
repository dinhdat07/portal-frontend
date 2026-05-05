import { HttpErrorResponse } from '@angular/common/http';

export interface MessageResponse {
  message: string;
}

export interface ApiErrorPayload {
  error?: string;
  message?: string;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function toApiError(error: unknown, fallback = 'Request failed'): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof HttpErrorResponse) {
    const payload = error.error as ApiErrorPayload | null;
    return new ApiError(error.status, payload?.error || payload?.message || fallback);
  }

  if (error instanceof Error) {
    return new ApiError(0, error.message || fallback);
  }

  return new ApiError(0, fallback);
}

export function getErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (error instanceof ApiError) {
    return error.message || fallback;
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
}
