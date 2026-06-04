import { Injectable, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, firstValueFrom, map, of } from 'rxjs';
import { UsersApiService } from '../api/users-api.service';
import { AuthApiService } from '../api/auth-api.service';
import {
  AuthSession,
  LoginResponse,
} from '../models/auth.models';
import { UserSummary, mapTransportUser } from '../models/user.models';

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private readonly sessionState = signal<AuthSession | null>(null);
  private readonly hydratedState = signal(false);
  private refreshPromise: Promise<boolean> | null = null;

  readonly session = computed(() => this.sessionState());
  readonly hydrated = computed(() => this.hydratedState());
  readonly currentUser = computed(() => this.sessionState()?.user ?? null);
  readonly authenticated = computed(() => this.sessionState() !== null);

  constructor(
    private readonly authApi: AuthApiService,
    private readonly usersApi: UsersApiService,
    private readonly router: Router,
  ) {
    this.hydrate();
  }

  setSessionFromLogin(response: LoginResponse): void {
    const session: AuthSession = {
      tokenType: response.token_type,
      expiresAt: this.buildExpiresAt(response.expires_in),
      user: mapTransportUser(response.user),
    };

    this.sessionState.set(session);
  }

  updateUser(user: UserSummary): void {
    const current = this.sessionState();
    if (!current) return;

    this.sessionState.set({ ...current, user });
  }

  clearSession(): void {
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
      map(() => this.clearSession()),
    );
  }

  signOutAll() {
    return this.authApi.logoutAll().pipe(
      map(() => void 0),
      catchError(() => of(void 0)),
      map(() => this.clearSession()),
    );
  }

  async refreshAccessToken(): Promise<boolean> {
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = firstValueFrom(this.authApi.refreshToken())
      .then(() => true)
      .catch(() => false)
      .finally(() => {
        this.refreshPromise = null;
      });

    return this.refreshPromise;
  }

  private hydrate(): void {
    this.usersApi.getMyProfile().subscribe({
      next: (user) => {
        this.sessionState.set({
          tokenType: 'Bearer',
          expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          user,
        });
        this.hydratedState.set(true);
      },
      error: () => {
        this.hydratedState.set(true);
      },
    });
  }

  private buildExpiresAt(expiresIn: number): string {
    return new Date(Date.now() + expiresIn * 1000).toISOString();
  }
}
