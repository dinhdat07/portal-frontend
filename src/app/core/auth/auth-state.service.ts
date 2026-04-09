import { Injectable, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { AuthApiService } from '../api/auth-api.service';
import {
  AuthSession,
  LoginResponse,
  RefreshResponse,
} from '../models/auth.models';
import { UserSummary, mapTransportUser } from '../models/user.models';

const STORAGE_KEY = 'portal_frontend_angular.session';

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private readonly sessionState = signal<AuthSession | null>(null);
  private readonly hydratedState = signal(false);
  private refreshPromise: Promise<boolean> | null = null;

  readonly session = computed(() => this.sessionState());
  readonly hydrated = computed(() => this.hydratedState());
  readonly currentUser = computed(() => this.sessionState()?.user ?? null);
  readonly authenticated = computed(() => {
    const session = this.sessionState();
    if (!session) {
      return false;
    }
    return Boolean(session);
  });

  constructor(
    private readonly authApi: AuthApiService,
    private readonly router: Router,
  ) {
    this.hydrate();
  }

  getAccessToken(): string | null {
    return this.sessionState()?.accessToken ?? null;
  }

  hasRefreshToken(): boolean {
    return Boolean(this.sessionState()?.refreshToken);
  }

  setSessionFromLogin(response: LoginResponse): void {
    const session: AuthSession = {
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      tokenType: response.token_type,
      expiresAt: this.buildExpiresAt(response.expires_in),
      user: mapTransportUser(response.user),
    };

    this.persistSession(session);
  }

  updateUser(user: UserSummary): void {
    const current = this.sessionState();
    if (!current) {
      return;
    }

    this.persistSession({
      ...current,
      user,
    });
  }

  clearSession(): void {
    window.localStorage.removeItem(STORAGE_KEY);
    this.sessionState.set(null);
  }

  handleUnauthorized(): void {
    this.clearSession();
    this.router.navigateByUrl('/login');
  }

  signOut() {
    return this.authApi.logout().pipe(
      map(() => void 0),
      catchError(() => of(void 0)),
      map(() => {
        this.clearSession();
      }),
    );
  }

  async refreshAccessToken(): Promise<boolean> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshToken = this.sessionState()?.refreshToken;
    if (!refreshToken) {
      return false;
    }

    this.refreshPromise = firstValueFrom(this.authApi.refreshToken(refreshToken))
      .then((response) => {
        this.applyRefreshResponse(response);
        return true;
      })
      .catch(() => {
        this.clearSession();
        return false;
      })
      .finally(() => {
        this.refreshPromise = null;
      });

    return this.refreshPromise;
  }

  private hydrate(): void {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      this.hydratedState.set(true);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as AuthSession;
      if (!parsed.accessToken || !parsed.refreshToken || !parsed.expiresAt || !parsed.user) {
        this.clearSession();
      } else {
        this.sessionState.set(parsed);
      }
    } catch {
      this.clearSession();
    }

    this.hydratedState.set(true);
  }

  private applyRefreshResponse(response: RefreshResponse): void {
    const current = this.sessionState();
    if (!current) {
      return;
    }

    this.persistSession({
      ...current,
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      tokenType: response.token_type,
      expiresAt: this.buildExpiresAt(response.expires_in),
    });
  }

  private buildExpiresAt(expiresInSeconds: number): string {
    return new Date(Date.now() + expiresInSeconds * 1000).toISOString();
  }

  private persistSession(session: AuthSession): void {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    this.sessionState.set(session);
  }
}
