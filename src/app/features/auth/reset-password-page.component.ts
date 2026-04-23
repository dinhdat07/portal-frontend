import { Component, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthApiService } from '../../core/api/auth-api.service';
import { getErrorMessage } from '../../core/api/api.types';

const passwordMatchValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const pw = group.get('password')?.value;
  const cpw = group.get('confirmPassword')?.value;
  if (!pw || !cpw) return null;
  return pw === cpw ? null : { passwordMismatch: true };
};

@Component({
  selector: 'app-reset-password-page',
  imports: [ReactiveFormsModule, NgIf],
  template: `
    <div class="card">
      <header class="card-head">
        <p class="eyebrow">Password reset</p>
        <h2>Reset your password</h2>
        <p>Choose a new password to secure your account.</p>
      </header>
      <form class="card-body form-grid" [formGroup]="form" (ngSubmit)="submit()">
        <div class="alert warning" *ngIf="!token">No reset token was found in the URL.</div>
        <div class="alert danger" *ngIf="error()">{{ error() }}</div>
        <label class="field" id="reset-password-field">
          <span>New password</span>
          <input type="password" formControlName="password" />
          <small class="field-error" *ngIf="fieldError('password')">{{ fieldError('password') }}</small>
        </label>
        <label class="field" id="reset-confirm-field">
          <span>Confirm password</span>
          <input type="password" formControlName="confirmPassword" />
          <small class="field-error" *ngIf="fieldError('confirmPassword')">{{ fieldError('confirmPassword') }}</small>
        </label>
        <button type="submit" class="btn btn-primary" id="reset-submit" [disabled]="loading() || !token">
          {{ loading() ? 'Saving...' : 'Reset password' }}
        </button>
      </form>
    </div>
  `,
})
export class ResetPasswordPageComponent {
  readonly token: string;
  readonly loading = signal(false);
  readonly error = signal('');
  readonly submitted = signal(false);
  readonly form = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(255)]],
    confirmPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(255)]],
  }, { validators: [passwordMatchValidator] });

  constructor(route: ActivatedRoute, private readonly fb: NonNullableFormBuilder, private readonly authApi: AuthApiService, private readonly router: Router) {
    document.title = 'Reset Password | Portal';
    this.token = route.snapshot.queryParamMap.get('token') ?? '';
  }

  submit(): void {
    this.submitted.set(true);
    this.error.set('');
    if (!this.token || this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    const v = this.form.getRawValue();
    this.authApi.resetPassword({ token: this.token, password: v.password, confirm_password: v.confirmPassword }).subscribe({
      next: () => { this.loading.set(false); this.router.navigateByUrl('/login'); },
      error: (e: unknown) => { this.loading.set(false); this.error.set(getErrorMessage(e, 'Unable to reset password')); },
    });
  }

  fieldError(name: 'password' | 'confirmPassword'): string | null {
    const c = this.form.controls[name];
    if (!c || (!c.touched && !this.submitted())) return null;
    if (c.hasError('required')) return name === 'password' ? 'Password is required' : 'Password confirmation is required';
    if (c.hasError('minlength')) return 'Minimum 8 characters';
    if (c.hasError('maxlength')) return 'Maximum 255 characters';
    if (name === 'confirmPassword' && this.form.hasError('passwordMismatch')) return 'Password confirmation does not match';
    return null;
  }
}
