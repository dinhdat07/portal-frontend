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
import { UsersApiService } from '../../core/api/users-api.service';
import { getErrorMessage } from '../../core/api/api.types';
import { AuthStateService } from '../../core/auth/auth-state.service';
import { Router } from '@angular/router';

const passwordMatchValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const password = group.get('newPassword')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;

  if (!password || !confirmPassword) {
    return null;
  }

  return password === confirmPassword ? null : { passwordMismatch: true };
};

@Component({
  selector: 'app-security-page',
  imports: [ReactiveFormsModule, NgIf],
  template: `
    <div class="stack-lg">
      <section class="page-head">
        <div>
          <p class="eyebrow">Account</p>
          <h1>Security settings</h1>
          <p>Change your password to keep your account secure.</p>
        </div>
      </section>

      <div class="grid-main security-grid">
        <article class="panel section-card">
          <form class="form-grid" [formGroup]="form" (ngSubmit)="submit()">
            <div class="alert danger" *ngIf="error()">{{ error() }}</div>
            <div class="alert success" *ngIf="successMessage()">{{ successMessage() }}</div>

            <label class="field">
              <span>Current password</span>
              <input type="password" formControlName="currentPassword" />
              <small class="field-error" *ngIf="fieldError('currentPassword')">{{ fieldError('currentPassword') }}</small>
            </label>

            <label class="field">
              <span>New password</span>
              <input type="password" formControlName="newPassword" />
              <small class="field-error" *ngIf="fieldError('newPassword')">{{ fieldError('newPassword') }}</small>
            </label>

            <label class="field">
              <span>Confirm new password</span>
              <input type="password" formControlName="confirmPassword" />
              <small class="field-error" *ngIf="fieldError('confirmPassword')">{{ fieldError('confirmPassword') }}</small>
            </label>

            <button type="submit" class="btn btn-primary" [disabled]="saving()">
              {{ saving() ? 'Saving...' : 'Update password' }}
            </button>
          </form>
        </article>

        <article class="panel section-card">
          <h3>Password tips</h3>
          <ul>
            <li>Use at least 8 characters.</li>
            <li>Combine upper/lowercase letters, numbers, and symbols.</li>
            <li>Avoid reusing passwords from other apps.</li>
          </ul>
        </article>
      </div>

      <div class="grid-main security-grid" style="margin-top: 2rem;">
        <article class="panel section-card" style="border-color: var(--danger);">
          <h3 style="color: var(--danger);">Danger Zone</h3>
          <p>Log out of all active sessions across all your devices.</p>
          <button type="button" class="btn btn-danger" [disabled]="loggingOutAll()" (click)="logoutAll()">
            {{ loggingOutAll() ? 'Logging out...' : 'Log out from all devices' }}
          </button>
        </article>
      </div>
    </div>
  `,
})
export class SecurityPageComponent {
  readonly error = signal('');
  readonly successMessage = signal('');
  readonly saving = signal(false);
  readonly submitted = signal(false);
  readonly loggingOutAll = signal(false);

  readonly form = this.fb.group(
    {
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(255)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(255)]],
    },
    { validators: [passwordMatchValidator] },
  );

  constructor(
    private readonly fb: NonNullableFormBuilder,
    private readonly usersApi: UsersApiService,
    private readonly authState: AuthStateService,
    private readonly router: Router,
  ) {
    document.title = 'Security | Portal Frontend';
  }

  submit(): void {
    this.submitted.set(true);
    this.error.set('');
    this.successMessage.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.saving.set(true);

    this.usersApi
      .changeMyPassword({
        current_password: value.currentPassword,
        new_password: value.newPassword,
        confirm_new_password: value.confirmPassword,
      })
      .subscribe({
        next: (response) => {
          this.saving.set(false);
          this.successMessage.set(response.message);
          this.form.reset();
        },
        error: (error: unknown) => {
          this.saving.set(false);
          this.error.set(getErrorMessage(error, 'Unable to change password'));
        },
      });
  }

  fieldError(name: 'currentPassword' | 'newPassword' | 'confirmPassword'): string | null {
    const control = this.form.controls[name];
    if (!control || (!control.touched && !this.submitted())) {
      return null;
    }

    if (control.hasError('required')) {
      if (name === 'currentPassword') {
        return 'Current password is required';
      }
      return name === 'newPassword' ? 'New password is required' : 'Password confirmation is required';
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

  logoutAll(): void {
    if (!confirm('Are you sure you want to log out from all devices? You will be signed out of this device as well.')) {
      return;
    }

    this.loggingOutAll.set(true);
    this.authState.signOutAll().subscribe({
      next: () => {
        this.loggingOutAll.set(false);
        this.router.navigate(['/login']);
      },
      error: () => {
        this.loggingOutAll.set(false);
        this.router.navigate(['/login']);
      }
    });
  }
}
