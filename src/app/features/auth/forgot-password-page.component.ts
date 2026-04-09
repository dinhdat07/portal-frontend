import { Component, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthApiService } from '../../core/api/auth-api.service';
import { getErrorMessage } from '../../core/api/api.types';

@Component({
  selector: 'app-forgot-password-page',
  imports: [ReactiveFormsModule, RouterLink, NgIf],
  template: `
    <div class="card">
      <header class="card-head">
        <p class="eyebrow">Password recovery</p>
        <h2>Forgot your password?</h2>
        <p>Enter your email and we will send you a reset link.</p>
      </header>

      <form class="card-body form-grid" [formGroup]="form" (ngSubmit)="submit()">
        <div class="alert danger" *ngIf="error()">{{ error() }}</div>
        <div class="alert success" *ngIf="successMessage()">{{ successMessage() }}</div>

        <label class="field" *ngIf="!requestedEmail()">
          <span>Email</span>
          <input type="email" formControlName="email" placeholder="ada@example.com" />
          <small class="field-error" *ngIf="fieldError()">{{ fieldError() }}</small>
        </label>

        <p class="muted" *ngIf="requestedEmail()">
          Reset link will be sent to <strong>{{ requestedEmail() }}</strong>.
        </p>

        <button type="submit" class="btn btn-primary" [disabled]="loading()">
          {{ loading() ? 'Sending...' : requestedEmail() ? 'Resend reset email' : 'Send reset email' }}
        </button>

        <p class="center-text">
          Remembered it?
          <a routerLink="/login">Back to sign in</a>
        </p>
      </form>
    </div>
  `,
})
export class ForgotPasswordPageComponent {
  readonly loading = signal(false);
  readonly error = signal('');
  readonly successMessage = signal('');
  readonly requestedEmail = signal('');
  readonly submitted = signal(false);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  constructor(
    private readonly fb: NonNullableFormBuilder,
    private readonly authApi: AuthApiService,
  ) {
    document.title = 'Forgot Password | Portal Frontend';
  }

  submit(): void {
    this.submitted.set(true);
    this.error.set('');
    this.successMessage.set('');

    if (!this.requestedEmail() && this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const email = this.requestedEmail() || this.form.controls.email.value;
    this.loading.set(true);

    this.authApi.forgotPassword({ email }).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.successMessage.set(response.message);
        this.requestedEmail.set(email);
        this.form.controls.email.setValue(email);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.error.set(getErrorMessage(error, 'Unable to process the request'));
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
