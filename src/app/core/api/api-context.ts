import { HttpContext, HttpContextToken } from '@angular/common/http';

export const AUTH_REQUIRED = new HttpContextToken<boolean>(() => true);
export const ALREADY_RETRIED = new HttpContextToken<boolean>(() => false);

export function publicApiContext(): HttpContext {
  return new HttpContext().set(AUTH_REQUIRED, false);
}
