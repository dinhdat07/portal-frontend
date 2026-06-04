import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { ALREADY_RETRIED } from './api-context';
import { AuthStateService } from '../auth/auth-state.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authState = inject(AuthStateService);

  // Cookies are auto-sent by browser with withCredentials — no manual header needed.
  // Still handle 401 → refresh logic.

  return next(req).pipe(
    catchError((error: unknown) => {
      const httpError = error as HttpErrorResponse;

      if (httpError.status !== 401) {
        return throwError(() => error);
      }

      if (req.context.get(ALREADY_RETRIED)) {
        authState.handleUnauthorized();
        return throwError(() => error);
      }

      return from(authState.refreshAccessToken()).pipe(
        switchMap((refreshed) => {
          if (!refreshed) {
            authState.handleUnauthorized();
            return throwError(() => error);
          }

          const retryRequest = req.clone({
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
