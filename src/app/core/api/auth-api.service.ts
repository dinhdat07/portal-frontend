import { Injectable } from '@angular/core';
import { HttpBackend, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { appConfig } from '../config/app-config';
import {
  ApiMessageResponse,
  LoginRequest,
  LoginResponse,
  RefreshResponse,
} from '../models/auth.models';
import { publicApiContext } from './api-context';
import { ApiClientService } from './api-client.service';
import { ApiErrorPayload, ApiError } from './api.types';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly rawHttp: HttpClient;

  constructor(
    private readonly api: ApiClientService,
    backend: HttpBackend,
  ) {
    this.rawHttp = new HttpClient(backend);
  }

  login(payload: LoginRequest) {
    return this.api.post<LoginResponse>('/auth/login', payload, {
      context: publicApiContext(),
    });
  }

  register(payload: {
    email: string;
    username: string;
    first_name: string;
    last_name: string;
    password: string;
    dob: string;
  }) {
    return this.api.post<ApiMessageResponse>('/auth/register', payload, {
      context: publicApiContext(),
    });
  }

  verifyEmail(payload: { token: string }) {
    return this.api.post<ApiMessageResponse>('/auth/verify-email', payload, {
      context: publicApiContext(),
    });
  }

  resendVerification(payload: { email: string }) {
    return this.api.post<ApiMessageResponse>('/auth/resend-verification', payload, {
      context: publicApiContext(),
    });
  }

  forgotPassword(payload: { email: string }) {
    return this.api.post<ApiMessageResponse>('/auth/forgot-password', payload, {
      context: publicApiContext(),
    });
  }

  resetPassword(payload: { token: string; password: string; confirm_password: string }) {
    return this.api.post<ApiMessageResponse>('/auth/reset-password', payload, {
      context: publicApiContext(),
    });
  }

  setPassword(payload: { token: string; password: string; confirm_password: string }) {
    return this.api.post<ApiMessageResponse>('/auth/set-password', payload, {
      context: publicApiContext(),
    });
  }

  logout() {
    return this.api.post<ApiMessageResponse>('/auth/logout');
  }

  logoutAll() {
    return this.api.post<ApiMessageResponse>('/auth/logout-all');
  }

  refreshToken() {
    // No body needed — refresh_token cookie is auto-sent by browser with withCredentials
    return this.rawHttp
      .post<RefreshResponse>(`${appConfig.apiBaseUrl}/auth/refresh`, {})
      .pipe(
        catchError((error: HttpErrorResponse) => {
          const payload = error.error as ApiErrorPayload | null;
          return throwError(
            () => new ApiError(error.status, payload?.error || payload?.message || 'Request failed'),
          );
        }),
      );
  }
}
