import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthStateService } from './auth-state.service';

function redirectToLogin(router: Router, fromPath?: string) {
  if (fromPath) {
    return router.createUrlTree(['/login'], {
      queryParams: { from: fromPath },
    });
  }

  return router.createUrlTree(['/login']);
}

function redirectToProfile(router: Router) {
  return router.createUrlTree(['/account/profile']);
}

export const authGuard: CanActivateFn = (_route, state) => {
  const authState = inject(AuthStateService);
  const router = inject(Router);

  return authState.authenticated() ? true : redirectToLogin(router, state.url);
};

export const authChildGuard: CanActivateChildFn = (_route, state) => {
  const authState = inject(AuthStateService);
  const router = inject(Router);

  return authState.authenticated() ? true : redirectToLogin(router, state.url);
};

export const guestGuard: CanActivateFn = () => {
  const authState = inject(AuthStateService);
  const router = inject(Router);

  return authState.authenticated() ? redirectToProfile(router) : true;
};

export const guestChildGuard: CanActivateChildFn = () => {
  const authState = inject(AuthStateService);
  const router = inject(Router);

  return authState.authenticated() ? redirectToProfile(router) : true;
};

export const adminGuard: CanActivateFn = () => {
  const authState = inject(AuthStateService);
  const router = inject(Router);

  const user = authState.currentUser();
  if (!user) {
    return redirectToLogin(router);
  }

  return user.role === 'admin' ? true : redirectToProfile(router);
};
