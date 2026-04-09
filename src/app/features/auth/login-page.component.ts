import { Component, signal } from '@angular/core';
import { ReactiveFormsModule, Validators, NonNullableFormBuilder } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { AuthApiService } from '../../core/api/auth-api.service';
import { getErrorMessage } from '../../core/api/api.types';
import { AuthStateService } from '../../core/auth/auth-state.service';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, RouterLink, NgIf],
  template: `
    <div class="card">
      <header class="card-head">
        <p class="eyebrow">Authentication</p>
        <h2>Sign in to the portal</h2>
        <p>Welcome back. Sign in to continue to your account.</p>
      </header>

      <form class="card-body form-grid" [formGroup]="form" (ngSubmit)="submit()">
        <div class="alert danger" *ngIf="error()">{{ error() }}</div>

        <label class="field">
          <span>Email or username</span>
          <input type="text" formControlName="identifier" placeholder="ada@example.com" />
          <small class="field-error" *ngIf="fieldError('identifier')">{{ fieldError('identifier') }}</small>
        </label>

        <label class="field">
          <span>Password</span>
          <input type="password" formControlName="password" placeholder="Enter your password" />
          <small class="field-error" *ngIf="fieldError('password')">{{ fieldError('password') }}</small>
        </label>

        <button type="submit" class="btn btn-primary" [disabled]="loading()">
          {{ loading() ? 'Signing in...' : 'Sign in' }}
        </button>

        <div class="text-link-row">
          <a routerLink="/forgot-password">Forgot password?</a>
        </div>

        <p class="center-text">
          Need an account?
          <a routerLink="/register">Register here</a>
        </p>
      </form>
    </div>
  `,
})
export class LoginPageComponent {
  readonly loading = signal(false);
  readonly error = signal('');
  readonly submitted = signal(false);

  readonly form = this.fb.group({
    identifier: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  constructor(
    private readonly fb: NonNullableFormBuilder,
    private readonly authApi: AuthApiService,
    private readonly authState: AuthStateService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {
    document.title = 'Login | Portal Frontend';
  }

  submit(): void {
    this.submitted.set(true);
    this.error.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.authApi.login(this.form.getRawValue()).subscribe({
      next: (response) => {
        this.authState.setSessionFromLogin(response);
        const fromPath = this.route.snapshot.queryParamMap.get('from');
        const nextPath = fromPath && fromPath.startsWith('/') ? fromPath : '/account/profile';
        this.loading.set(false);
        this.router.navigateByUrl(nextPath);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.error.set(getErrorMessage(error, 'Unable to sign in'));
      },
    });
  }

  fieldError(name: 'identifier' | 'password'): string | null {
    const control = this.form.controls[name];
    if (!control || (!control.touched && !this.submitted())) {
      return null;
    }

    if (control.hasError('required')) {
      return name === 'identifier' ? 'Email or username is required' : 'Password is required';
    }

    return null;
  }
}
