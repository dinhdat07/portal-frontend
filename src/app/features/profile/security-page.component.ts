import { Component, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { UsersApiService } from '../../core/api/users-api.service';
import { getErrorMessage } from '../../core/api/api.types';
import { AuthStateService } from '../../core/auth/auth-state.service';
import { Router } from '@angular/router';

const passwordMatchValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const pw = group.get('newPassword')?.value;
  const cpw = group.get('confirmPassword')?.value;
  if (!pw || !cpw) return null;
  return pw === cpw ? null : { passwordMismatch: true };
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
            <label class="field"><span>Current password</span><input type="password" formControlName="currentPassword" /><small class="field-error" *ngIf="fieldError('currentPassword')">{{ fieldError('currentPassword') }}</small></label>
            <label class="field"><span>New password</span><input type="password" formControlName="newPassword" /><small class="field-error" *ngIf="fieldError('newPassword')">{{ fieldError('newPassword') }}</small></label>
            <label class="field"><span>Confirm new password</span><input type="password" formControlName="confirmPassword" /><small class="field-error" *ngIf="fieldError('confirmPassword')">{{ fieldError('confirmPassword') }}</small></label>
            <button type="submit" class="btn btn-primary" id="security-save-btn" [disabled]="saving()">{{ saving() ? 'Saving...' : 'Update password' }}</button>
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
        <article class="panel section-card" style="border-color: var(--error);">
          <h3 style="color: var(--error);">Danger Zone</h3>
          <p>Log out of all active sessions across all your devices.</p>
          <button type="button" class="btn btn-danger" id="logout-all-btn" [disabled]="loggingOutAll()" (click)="logoutAll()" style="margin-top: var(--space-3);">
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
  readonly form = this.fb.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(255)]],
    confirmPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(255)]],
  }, { validators: [passwordMatchValidator] });

  constructor(private readonly fb: NonNullableFormBuilder, private readonly usersApi: UsersApiService, private readonly authState: AuthStateService, private readonly router: Router) {
    document.title = 'Security | Portal';
  }

  submit(): void {
    this.submitted.set(true); this.error.set(''); this.successMessage.set('');
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.usersApi.changeMyPassword({ current_password: v.currentPassword, new_password: v.newPassword, confirm_new_password: v.confirmPassword }).subscribe({
      next: (r) => { this.saving.set(false); this.successMessage.set(r.message); this.form.reset(); },
      error: (e: unknown) => { this.saving.set(false); this.error.set(getErrorMessage(e, 'Unable to change password')); },
    });
  }

  fieldError(name: 'currentPassword' | 'newPassword' | 'confirmPassword'): string | null {
    const c = this.form.controls[name];
    if (!c || (!c.touched && !this.submitted())) return null;
    if (c.hasError('required')) { if (name === 'currentPassword') return 'Current password is required'; return name === 'newPassword' ? 'New password is required' : 'Password confirmation is required'; }
    if (c.hasError('minlength')) return 'Minimum 8 characters';
    if (c.hasError('maxlength')) return 'Maximum 255 characters';
    if (name === 'confirmPassword' && this.form.hasError('passwordMismatch')) return 'Password confirmation does not match';
    return null;
  }

  logoutAll(): void {
    if (!confirm('Are you sure you want to log out from all devices? You will be signed out of this device as well.')) return;
    this.loggingOutAll.set(true);
    this.authState.signOutAll().subscribe({
      next: () => { this.loggingOutAll.set(false); this.router.navigate(['/login']); },
      error: () => { this.loggingOutAll.set(false); this.router.navigate(['/login']); },
    });
  }
}
