import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpContext,
  HttpErrorResponse,
  HttpParams,
} from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { appConfig } from '../config/app-config';
import { ApiError, ApiErrorPayload } from './api.types';

export interface RequestOptions {
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  context?: HttpContext;
}

@Injectable({ providedIn: 'root' })
export class ApiClientService {
  constructor(private readonly http: HttpClient) {}

  get<T>(path: string, options?: Omit<RequestOptions, 'body'>) {
    return this.request<T>('GET', path, options);
  }

  post<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) {
    return this.request<T>('POST', path, { ...options, body });
  }

  put<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) {
    return this.request<T>('PUT', path, { ...options, body });
  }

  delete<T>(path: string, options?: Omit<RequestOptions, 'body'>) {
    return this.request<T>('DELETE', path, options);
  }

  private request<T>(method: string, path: string, options?: RequestOptions) {
    const params = this.toParams(options?.query);

    return this.http
      .request<T>(method, `${appConfig.apiBaseUrl}${path}`, {
        body: options?.body,
        params,
        context: options?.context,
      })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          const payload = error.error as ApiErrorPayload | null;
          return throwError(
            () => new ApiError(error.status, payload?.error || payload?.message || 'Request failed'),
          );
        }),
      );
  }

  private toParams(query?: Record<string, string | number | boolean | undefined | null>) {
    let params = new HttpParams();

    if (!query) {
      return params;
    }

    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return;
      }
      params = params.set(key, String(value));
    });

    return params;
  }
}
