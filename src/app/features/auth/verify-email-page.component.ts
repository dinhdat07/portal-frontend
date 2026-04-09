import { Component, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthApiService } from '../../core/api/auth-api.service';
import { getErrorMessage } from '../../core/api/api.types';

@Component({
  selector: 'app-verify-email-page',
  imports: [NgIf, RouterLink],
  template: `
    <div class="card">
      <header class="card-head">
        <p class="eyebrow">Email verification</p>
        <h2>Verify your account</h2>
        <p>We are confirming your email so you can start using your account.</p>
      </header>

      <section class="card-body stack">
        <div class="alert warning" *ngIf="!token">No verification token was found in the URL.</div>
        <div class="alert info" *ngIf="token && loading()">Verifying your email...</div>
        <div class="alert success" *ngIf="successMessage()">{{ successMessage() }}</div>
        <div class="alert danger" *ngIf="error()">{{ error() }}</div>

        <div class="grid-actions">
          <a class="btn btn-primary" routerLink="/login">Go to sign in</a>
          <a class="btn btn-secondary" routerLink="/resend-verification" *ngIf="!successMessage()">
            Resend verification
          </a>
        </div>
      </section>
    </div>
  `,
})
export class VerifyEmailPageComponent {
  readonly token: string;
  readonly loading = signal(false);
  readonly successMessage = signal('');
  readonly error = signal('');

  constructor(
    route: ActivatedRoute,
    private readonly authApi: AuthApiService,
  ) {
    document.title = 'Verify Email | Portal Frontend';
    this.token = route.snapshot.queryParamMap.get('token') ?? '';
    if (this.token) {
      this.verify();
    }
  }

  private verify(): void {
    this.loading.set(true);
    this.error.set('');
    this.successMessage.set('');

    this.authApi.verifyEmail({ token: this.token }).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.successMessage.set(response.message);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.error.set(getErrorMessage(error, 'Unable to verify email'));
      },
    });
  }
}
