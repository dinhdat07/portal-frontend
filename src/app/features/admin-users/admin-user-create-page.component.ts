import { Component, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminUsersApiService } from '../../core/api/admin-users-api.service';
import { getErrorMessage } from '../../core/api/api.types';
import { getTodayDateInputValue } from '../../core/utils/date-utils';

@Component({
  selector: 'app-admin-user-create-page',
  imports: [ReactiveFormsModule, RouterLink, NgIf],
  template: `
    <div class="stack-lg">
      <section class="page-head">
        <div>
          <p class="eyebrow">Admin</p>
          <h1>Create user</h1>
          <p>Create a new user account and choose their role.</p>
        </div>
        <a class="btn btn-secondary" routerLink="/admin/users">Cancel</a>
      </section>

      <article class="panel section-card">
        <div class="alert info">After creation, the user will receive an email to complete account setup.</div>

        <form class="form-grid" [formGroup]="form" (ngSubmit)="submit()">
          <div class="alert danger" *ngIf="error()">{{ error() }}</div>

          <div class="grid-cols-2">
            <label class="field">
              <span>First name</span>
              <input type="text" formControlName="firstName" />
              <small class="field-error" *ngIf="fieldError('firstName')">{{ fieldError('firstName') }}</small>
            </label>

            <label class="field">
              <span>Last name</span>
              <input type="text" formControlName="lastName" />
              <small class="field-error" *ngIf="fieldError('lastName')">{{ fieldError('lastName') }}</small>
            </label>
          </div>

          <label class="field">
            <span>Email</span>
            <input type="email" formControlName="email" />
            <small class="field-error" *ngIf="fieldError('email')">{{ fieldError('email') }}</small>
          </label>

          <div class="grid-cols-2">
            <label class="field">
              <span>Username</span>
              <input type="text" formControlName="username" />
              <small class="field-error" *ngIf="fieldError('username')">{{ fieldError('username') }}</small>
            </label>

            <label class="field">
              <span>Date of birth</span>
              <input type="date" formControlName="dob" [max]="today" />
              <small class="field-error" *ngIf="fieldError('dob')">{{ fieldError('dob') }}</small>
            </label>
          </div>

          <label class="field">
            <span>Role</span>
            <select formControlName="role"><option value="user">user</option><option value="admin">admin</option></select>
            <small class="field-error" *ngIf="fieldError('role')">{{ fieldError('role') }}</small>
          </label>

          <div class="btn-row">
            <button type="submit" class="btn btn-primary" [disabled]="loading()">{{ loading() ? 'Creating...' : 'Create user' }}</button>
            <a class="btn btn-secondary" routerLink="/admin/users">Cancel</a>
          </div>
        </form>
      </article>
    </div>
  `,
})
export class AdminUserCreatePageComponent {
  readonly today = getTodayDateInputValue();
  readonly loading = signal(false);
  readonly error = signal('');
  readonly submitted = signal(false);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    dob: ['', [Validators.required]],
    role: this.fb.control<'user' | 'admin'>('user', [Validators.required]),
  });

  constructor(
    private readonly fb: NonNullableFormBuilder,
    private readonly adminUsersApi: AdminUsersApiService,
    private readonly router: Router,
  ) {
    document.title = 'Create User | Portal Frontend';
  }

  submit(): void {
    this.submitted.set(true);
    this.error.set('');

    if (this.form.controls.dob.value > this.today) {
      this.form.controls.dob.setErrors({ futureDate: true });
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const value = this.form.getRawValue();

    this.adminUsersApi
      .createAdminUser({
        email: value.email,
        username: value.username,
        first_name: value.firstName,
        last_name: value.lastName,
        dob: value.dob,
        role: value.role,
      })
      .subscribe({
        next: (user) => {
          this.loading.set(false);
          this.router.navigate(['/admin/users', user.id]);
        },
        error: (error: unknown) => {
          this.loading.set(false);
          this.error.set(getErrorMessage(error, 'Unable to create user'));
        },
      });
  }

  fieldError(name: 'email' | 'username' | 'firstName' | 'lastName' | 'dob' | 'role'): string | null {
    const control = this.form.controls[name];
    if (!control || (!control.touched && !this.submitted())) {
      return null;
    }

    if (control.hasError('required')) {
      if (name === 'firstName') return 'First name is required';
      if (name === 'lastName') return 'Last name is required';
      if (name === 'dob') return 'Date of birth is required';
      if (name === 'role') return 'Role is required';
      return `${name.charAt(0).toUpperCase()}${name.slice(1)} is required`;
    }

    if (control.hasError('email')) return 'Enter a valid email';
    if (control.hasError('minlength')) return 'Minimum 3 characters';
    if (control.hasError('maxlength')) return name === 'username' ? 'Maximum 50 characters' : 'Maximum 100 characters';
    if (control.hasError('futureDate')) return 'Date of birth cannot be in the future';

    return null;
  }
}
