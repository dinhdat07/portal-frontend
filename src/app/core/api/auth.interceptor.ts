import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { ALREADY_RETRIED, AUTH_REQUIRED } from './api-context';
import { AuthStateService } from '../auth/auth-state.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authState = inject(AuthStateService);

  if (!req.context.get(AUTH_REQUIRED)) {
    return next(req);
  }

  const accessToken = authState.getAccessToken();
  const requestWithAuth = accessToken
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
    : req;

  return next(requestWithAuth).pipe(
    catchError((error: unknown) => {
      const httpError = error as HttpErrorResponse;

      if (httpError.status !== 401) {
        return throwError(() => error);
      }

      if (req.context.get(ALREADY_RETRIED)) {
        authState.handleUnauthorized();
        return throwError(() => error);
      }

      if (!authState.hasRefreshToken()) {
        authState.handleUnauthorized();
        return throwError(() => error);
      }

      return from(authState.refreshAccessToken()).pipe(
        switchMap((refreshed) => {
          if (!refreshed) {
            authState.handleUnauthorized();
            return throwError(() => error);
          }

          const latestToken = authState.getAccessToken();
          if (!latestToken) {
            authState.handleUnauthorized();
            return throwError(() => error);
          }

          const retryRequest = req.clone({
            setHeaders: {
              Authorization: `Bearer ${latestToken}`,
            },
            context: req.context.set(ALREADY_RETRIED, true),
          });

          return next(retryRequest);
        }),
        catchError((refreshError) => {
          authState.handleUnauthorized();
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
