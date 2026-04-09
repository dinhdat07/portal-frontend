import { Component, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthApiService } from '../../core/api/auth-api.service';
import { getErrorMessage } from '../../core/api/api.types';

@Component({
  selector: 'app-register-success-page',
  imports: [NgIf, RouterLink],
  template: `
    <div class="card">
      <header class="card-head">
        <p class="eyebrow">Registration complete</p>
        <h2>Check your email</h2>
        <p>
          We sent a verification email{{ email ? ' to ' + email : '' }}.
          Open that message to activate your account.
        </p>
      </header>

      <section class="card-body stack">
        <div class="alert info" *ngIf="email">
          If the message does not arrive, you can resend the verification email from this page.
        </div>

        <div class="alert warning" *ngIf="!email">
          The email address was not available. Use the resend page if you need another verification email.
        </div>

        <div class="alert success" *ngIf="successMessage()">{{ successMessage() }}</div>
        <div class="alert danger" *ngIf="error()">{{ error() }}</div>

        <div class="grid-actions">
          <button class="btn btn-primary" [disabled]="!email || loading()" (click)="resend()">
            {{ loading() ? 'Sending...' : 'Resend verification' }}
          </button>
          <a class="btn btn-secondary" routerLink="/login">Back to sign in</a>
        </div>

        <p class="center-text" *ngIf="!email">
          Need to enter an email manually?
          <a routerLink="/resend-verification">Open resend page</a>
        </p>
      </section>
    </div>
  `,
})
export class RegisterSuccessPageComponent {
  readonly email: string;
  readonly loading = signal(false);
  readonly successMessage = signal('');
  readonly error = signal('');

  constructor(
    route: ActivatedRoute,
    private readonly authApi: AuthApiService,
  ) {
    document.title = 'Check Your Email | Portal Frontend';
    this.email = route.snapshot.queryParamMap.get('email') ?? '';
  }

  resend(): void {
    if (!this.email || this.loading()) {
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.successMessage.set('');

    this.authApi.resendVerification({ email: this.email }).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.successMessage.set(response.message);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.error.set(getErrorMessage(error, 'Unable to resend verification'));
      },
    });
  }
}
