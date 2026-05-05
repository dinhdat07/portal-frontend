import { Component, signal, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminUsersApiService } from '../../core/api/admin-users-api.service';
import { AdminRolesApiService } from '../../core/api/admin-roles-api.service';
import { getErrorMessage } from '../../core/api/api.types';
import { getTodayDateInputValue } from '../../core/utils/date-utils';
import { Role } from '../../core/models/user.models';

@Component({
  selector: 'app-admin-user-create-page',
  imports: [ReactiveFormsModule, RouterLink, NgIf, NgFor],
  template: `
    <div class="stack-lg">
      <section class="page-head">
        <div><p class="eyebrow">Admin</p><h1>Create user</h1><p>Create a new user account and choose their role.</p></div>
        <a class="btn btn-secondary" routerLink="/admin/users">Cancel</a>
      </section>
      <article class="panel section-card">
        <div class="alert info">After creation, the user will receive an email to complete account setup.</div>
        <form class="form-grid" [formGroup]="form" (ngSubmit)="submit()" style="margin-top: var(--space-4);">
          <div class="alert danger" *ngIf="error()">{{ error() }}</div>
          <div class="grid-cols-2">
            <label class="field"><span>First name</span><input type="text" formControlName="firstName" /><small class="field-error" *ngIf="fieldError('firstName')">{{ fieldError('firstName') }}</small></label>
            <label class="field"><span>Last name</span><input type="text" formControlName="lastName" /><small class="field-error" *ngIf="fieldError('lastName')">{{ fieldError('lastName') }}</small></label>
          </div>
          <label class="field"><span>Email</span><input type="email" formControlName="email" /><small class="field-error" *ngIf="fieldError('email')">{{ fieldError('email') }}</small></label>
          <div class="grid-cols-2">
            <label class="field"><span>Username</span><input type="text" formControlName="username" /><small class="field-error" *ngIf="fieldError('username')">{{ fieldError('username') }}</small></label>
            <label class="field"><span>Date of birth</span><input type="date" formControlName="dob" [max]="today" /><small class="field-error" *ngIf="fieldError('dob')">{{ fieldError('dob') }}</small></label>
          </div>
          <label class="field"><span>Role</span>
            <select formControlName="roleCode">
              <option value="" disabled>Select a role</option>
              <option *ngFor="let r of roles()" [value]="r.code">{{ r.name }}</option>
            </select>
            <small class="field-error" *ngIf="fieldError('roleCode')">{{ fieldError('roleCode') }}</small>
          </label>
          <div class="btn-row">
            <button type="submit" class="btn btn-primary" id="admin-create-submit" [disabled]="loading()">{{ loading() ? 'Creating...' : 'Create user' }}</button>
            <a class="btn btn-secondary" routerLink="/admin/users">Cancel</a>
          </div>
        </form>
      </article>
    </div>
  `,
})
export class AdminUserCreatePageComponent implements OnInit {
  readonly today = getTodayDateInputValue();
  readonly loading = signal(false);
  readonly error = signal('');
  readonly submitted = signal(false);
  readonly roles = signal<Role[]>([]);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    dob: ['', [Validators.required]],
    roleCode: ['', [Validators.required]],
  });

  constructor(private readonly fb: NonNullableFormBuilder, private readonly adminUsersApi: AdminUsersApiService, private readonly adminRolesApi: AdminRolesApiService, private readonly router: Router) {
    document.title = 'Create User | Portal';
  }

  ngOnInit() {
    this.adminRolesApi.getRoles().subscribe(roles => {
      this.roles.set(roles);
      // Pre-select 'user' role if it exists, otherwise select the first one
      if (roles.length > 0) {
        const userRole = roles.find(r => r.code === 'user');
        this.form.patchValue({ roleCode: userRole ? userRole.code : roles[0].code });
      }
    });
  }

  submit(): void {
    this.submitted.set(true); this.error.set('');
    if (this.form.controls.dob.value > this.today) { this.form.controls.dob.setErrors({ futureDate: true }); }
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    const v = this.form.getRawValue();
    this.adminUsersApi.createAdminUser({ email: v.email, username: v.username, first_name: v.firstName, last_name: v.lastName, dob: v.dob, role_code: v.roleCode }).subscribe({
      next: (u) => { this.loading.set(false); this.router.navigate(['/admin/users', u.id]); },
      error: (e: unknown) => { this.loading.set(false); this.error.set(getErrorMessage(e, 'Unable to create user')); },
    });
  }

  fieldError(name: 'email' | 'username' | 'firstName' | 'lastName' | 'dob' | 'roleCode'): string | null {
    const c = this.form.controls[name];
    if (!c || (!c.touched && !this.submitted())) return null;
    if (c.hasError('required')) { if (name === 'firstName') return 'First name is required'; if (name === 'lastName') return 'Last name is required'; if (name === 'dob') return 'Date of birth is required'; if (name === 'roleCode') return 'Role is required'; return `${name.charAt(0).toUpperCase()}${name.slice(1)} is required`; }
    if (c.hasError('email')) return 'Enter a valid email';
    if (c.hasError('minlength')) return 'Minimum 3 characters';
    if (c.hasError('maxlength')) return name === 'username' ? 'Maximum 50 characters' : 'Maximum 100 characters';
    if (c.hasError('futureDate')) return 'Date of birth cannot be in the future';
    return null;
  }
}
