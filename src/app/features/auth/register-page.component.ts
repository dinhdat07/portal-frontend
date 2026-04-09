import { Component, signal } from '@angular/core';
import { ReactiveFormsModule, Validators, NonNullableFormBuilder } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { AuthApiService } from '../../core/api/auth-api.service';
import { getErrorMessage } from '../../core/api/api.types';
import { getTodayDateInputValue } from '../../core/utils/date-utils';

@Component({
  selector: 'app-register-page',
  imports: [ReactiveFormsModule, RouterLink, NgIf],
  template: `
    <div class="card">
      <header class="card-head">
        <p class="eyebrow">Create account</p>
        <h2>Create your account</h2>
        <p>After signing up, we will send you a verification email.</p>
      </header>

      <form class="card-body form-grid" [formGroup]="form" (ngSubmit)="submit()">
        <div class="alert danger" *ngIf="error()">{{ error() }}</div>

        <div class="grid-cols-2">
          <label class="field">
            <span>First name</span>
            <input type="text" formControlName="firstName" placeholder="Ada" />
            <small class="field-error" *ngIf="fieldError('firstName')">{{ fieldError('firstName') }}</small>
          </label>

          <label class="field">
            <span>Last name</span>
            <input type="text" formControlName="lastName" placeholder="Lovelace" />
            <small class="field-error" *ngIf="fieldError('lastName')">{{ fieldError('lastName') }}</small>
          </label>
        </div>

        <label class="field">
          <span>Email</span>
          <input type="email" formControlName="email" placeholder="ada@example.com" />
          <small class="field-error" *ngIf="fieldError('email')">{{ fieldError('email') }}</small>
        </label>

        <div class="grid-cols-2">
          <label class="field">
            <span>Username</span>
            <input type="text" formControlName="username" placeholder="ada" />
            <small class="field-error" *ngIf="fieldError('username')">{{ fieldError('username') }}</small>
          </label>

          <label class="field">
            <span>Date of birth</span>
            <input type="date" formControlName="dob" [max]="today" />
            <small class="field-error" *ngIf="fieldError('dob')">{{ fieldError('dob') }}</small>
          </label>
        </div>

        <label class="field">
          <span>Password</span>
          <input type="password" formControlName="password" placeholder="Create a strong password" />
          <small class="field-error" *ngIf="fieldError('password')">{{ fieldError('password') }}</small>
        </label>

        <button type="submit" class="btn btn-primary" [disabled]="loading()">
          {{ loading() ? 'Creating account...' : 'Create account' }}
        </button>

        <p class="center-text">
          Already have an account?
          <a routerLink="/login">Sign in</a>
        </p>
      </form>
    </div>
  `,
})
export class RegisterPageComponent {
  readonly today = getTodayDateInputValue();
  readonly loading = signal(false);
  readonly error = signal('');
  readonly submitted = signal(false);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(255)]],
    dob: ['', [Validators.required]],
  });

  constructor(
    private readonly fb: NonNullableFormBuilder,
    private readonly authApi: AuthApiService,
    private readonly router: Router,
  ) {
    document.title = 'Register | Portal Frontend';
  }

  submit(): void {
    this.submitted.set(true);
    this.error.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.form.controls.dob.value > this.today) {
      this.form.controls.dob.setErrors({ futureDate: true });
      return;
    }

    this.loading.set(true);
    const formValue = this.form.getRawValue();

    this.authApi
      .register({
        email: formValue.email,
        username: formValue.username,
        first_name: formValue.firstName,
        last_name: formValue.lastName,
        password: formValue.password,
        dob: formValue.dob,
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.form.reset();
          this.router.navigate(['/register/verification-sent'], {
            queryParams: { email: formValue.email },
            replaceUrl: true,
          });
        },
        error: (error: unknown) => {
          this.loading.set(false);
          this.error.set(getErrorMessage(error, 'Unable to register'));
        },
      });
  }

  fieldError(name: 'email' | 'username' | 'firstName' | 'lastName' | 'password' | 'dob'): string | null {
    const control = this.form.controls[name];
    if (!control || (!control.touched && !this.submitted())) {
      return null;
    }

    if (control.hasError('required')) {
      if (name === 'dob') {
        return 'Date of birth is required';
      }
      if (name === 'firstName') {
        return 'First name is required';
      }
      if (name === 'lastName') {
        return 'Last name is required';
      }
      return `${name.charAt(0).toUpperCase()}${name.slice(1)} is required`;
    }

    if (control.hasError('email')) {
      return 'Enter a valid email';
    }

    if (control.hasError('minlength')) {
      return name === 'password' ? 'Minimum 8 characters' : 'Minimum 3 characters';
    }

    if (control.hasError('maxlength')) {
      if (name === 'password') {
        return 'Maximum 255 characters';
      }

      if (name === 'username') {
        return 'Maximum 50 characters';
      }

      return 'Maximum 100 characters';
    }

    if (control.hasError('futureDate')) {
      return 'Date of birth cannot be in the future';
    }

    return null;
  }
}
