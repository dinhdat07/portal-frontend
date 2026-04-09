import { Component, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthApiService } from '../../core/api/auth-api.service';
import { getErrorMessage } from '../../core/api/api.types';

@Component({
  selector: 'app-resend-verification-page',
  imports: [ReactiveFormsModule, RouterLink, NgIf],
  template: `
    <div class="card">
      <header class="card-head">
        <p class="eyebrow">Verification</p>
        <h2>Resend verification email</h2>
        <p>Did not get the first email? Enter your address and we will send it again.</p>
      </header>

      <form class="card-body form-grid" [formGroup]="form" (ngSubmit)="submit()">
        <div class="alert danger" *ngIf="error()">{{ error() }}</div>
        <div class="alert success" *ngIf="successMessage()">{{ successMessage() }}</div>

        <label class="field">
          <span>Email</span>
          <input type="email" formControlName="email" placeholder="ada@example.com" />
          <small class="field-error" *ngIf="fieldError()">{{ fieldError() }}</small>
        </label>

        <button type="submit" class="btn btn-primary" [disabled]="loading()">
          {{ loading() ? 'Sending...' : 'Resend verification' }}
        </button>

        <p class="center-text">
          Already verified?
          <a routerLink="/login">Sign in</a>
        </p>
      </form>
    </div>
  `,
})
export class ResendVerificationPageComponent {
  readonly loading = signal(false);
  readonly error = signal('');
  readonly successMessage = signal('');
  readonly submitted = signal(false);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  constructor(
    private readonly fb: NonNullableFormBuilder,
    private readonly authApi: AuthApiService,
  ) {
    document.title = 'Resend Verification | Portal Frontend';
  }

  submit(): void {
    this.submitted.set(true);
    this.error.set('');
    this.successMessage.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.authApi.resendVerification(this.form.getRawValue()).subscribe({
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

  fieldError(): string | null {
    const control = this.form.controls.email;
    if (!control || (!control.touched && !this.submitted())) {
      return null;
    }

    if (control.hasError('required')) {
      return 'Email is required';
    }

    if (control.hasError('email')) {
      return 'Enter a valid email';
    }

    return null;
  }
}
