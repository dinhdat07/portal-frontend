import { Component, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthApiService } from '../../core/api/auth-api.service';
import { getErrorMessage } from '../../core/api/api.types';

const passwordMatchValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const password = group.get('password')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;

  if (!password || !confirmPassword) {
    return null;
  }

  return password === confirmPassword ? null : { passwordMismatch: true };
};

@Component({
  selector: 'app-set-password-page',
  imports: [ReactiveFormsModule, NgIf],
  template: `
    <div class="card">
      <header class="card-head">
        <p class="eyebrow">Initial password</p>
        <h2>Set your password</h2>
        <p>Create your password to finish setting up your account.</p>
      </header>

      <form class="card-body form-grid" [formGroup]="form" (ngSubmit)="submit()">
        <div class="alert warning" *ngIf="!token">No setup token was found in the URL.</div>
        <div class="alert danger" *ngIf="error()">{{ error() }}</div>

        <label class="field">
          <span>Password</span>
          <input type="password" formControlName="password" />
          <small class="field-error" *ngIf="fieldError('password')">{{ fieldError('password') }}</small>
        </label>

        <label class="field">
          <span>Confirm password</span>
          <input type="password" formControlName="confirmPassword" />
          <small class="field-error" *ngIf="fieldError('confirmPassword')">{{ fieldError('confirmPassword') }}</small>
        </label>

        <button type="submit" class="btn btn-primary" [disabled]="loading() || !token">
          {{ loading() ? 'Saving...' : 'Set password' }}
        </button>
      </form>
    </div>
  `,
})
export class SetPasswordPageComponent {
  readonly token: string;
  readonly loading = signal(false);
  readonly error = signal('');
  readonly submitted = signal(false);

  readonly form = this.fb.group(
    {
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(255)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(255)]],
    },
    { validators: [passwordMatchValidator] },
  );

  constructor(
    route: ActivatedRoute,
    private readonly fb: NonNullableFormBuilder,
    private readonly authApi: AuthApiService,
    private readonly router: Router,
  ) {
    document.title = 'Set Password | Portal Frontend';
    this.token = route.snapshot.queryParamMap.get('token') ?? '';
  }

  submit(): void {
    this.submitted.set(true);
    this.error.set('');

    if (!this.token || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const value = this.form.getRawValue();

    this.authApi
      .setPassword({
        token: this.token,
        password: value.password,
        confirm_password: value.confirmPassword,
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.router.navigateByUrl('/login');
        },
        error: (error: unknown) => {
          this.loading.set(false);
          this.error.set(getErrorMessage(error, 'Unable to set password'));
        },
      });
  }

  fieldError(name: 'password' | 'confirmPassword'): string | null {
    const control = this.form.controls[name];
    if (!control || (!control.touched && !this.submitted())) {
      return null;
    }

    if (control.hasError('required')) {
      return name === 'password' ? 'Password is required' : 'Password confirmation is required';
    }

    if (control.hasError('minlength')) {
      return 'Minimum 8 characters';
    }

    if (control.hasError('maxlength')) {
      return 'Maximum 255 characters';
    }

    if (name === 'confirmPassword' && this.form.hasError('passwordMismatch')) {
      return 'Password confirmation does not match';
    }

    return null;
  }
}
