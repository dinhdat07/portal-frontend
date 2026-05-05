import { Component, computed, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminUsersApiService } from '../../core/api/admin-users-api.service';
import { getErrorMessage } from '../../core/api/api.types';
import { AuthStateService } from '../../core/auth/auth-state.service';
import { UserSummary } from '../../core/models/user.models';
import { getTodayDateInputValue, toDateInputValue } from '../../core/utils/date-utils';

@Component({
  selector: 'app-admin-user-edit-page',
  imports: [ReactiveFormsModule, RouterLink, NgIf],
  template: `
    <div class="stack-lg">
      <section class="page-head">
        <div><p class="eyebrow">Admin</p><h1>Edit user</h1><p>Update this user's profile details.</p></div>
        <a class="btn btn-secondary" [routerLink]="['/admin/users', userId]">Cancel</a>
      </section>
      <div class="loading" *ngIf="loading()">Loading user...</div>
      <div class="alert danger" *ngIf="loadError()">{{ loadError() }}</div>
      <div class="stack-md" *ngIf="!loading() && user()">
        <div class="alert warning" *ngIf="isOtherAdmin()">Other admin accounts cannot be edited from this screen.</div>
        <article class="panel section-card" *ngIf="!isOtherAdmin()">
          <form class="form-grid" [formGroup]="form" (ngSubmit)="submit()">
            <div class="alert danger" *ngIf="submitError()">{{ submitError() }}</div>
            <div class="grid-cols-2">
              <label class="field"><span>First name</span><input type="text" formControlName="firstName" /><small class="field-error" *ngIf="fieldError('firstName')">{{ fieldError('firstName') }}</small></label>
              <label class="field"><span>Last name</span><input type="text" formControlName="lastName" /><small class="field-error" *ngIf="fieldError('lastName')">{{ fieldError('lastName') }}</small></label>
            </div>
            <div class="grid-cols-2">
              <label class="field"><span>Username</span><input type="text" formControlName="username" /><small class="field-error" *ngIf="fieldError('username')">{{ fieldError('username') }}</small></label>
              <label class="field"><span>Date of birth</span><input type="date" formControlName="dob" [max]="today" /><small class="field-error" *ngIf="fieldError('dob')">{{ fieldError('dob') }}</small></label>
            </div>
            <div class="btn-row">
              <button type="submit" class="btn btn-primary" id="admin-edit-save-btn" [disabled]="saving()">{{ saving() ? 'Saving...' : 'Save user' }}</button>
              <a class="btn btn-secondary" [routerLink]="['/admin/users', userId]">Cancel</a>
            </div>
          </form>
        </article>
      </div>
    </div>
  `,
})
export class AdminUserEditPageComponent {
  readonly today = getTodayDateInputValue();
  readonly loading = signal(true);
  readonly loadError = signal('');
  readonly submitError = signal('');
  readonly saving = signal(false);
  readonly submitted = signal(false);
  readonly user = signal<UserSummary | null>(null);
  readonly form = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    dob: ['', [Validators.required]],
  });
  readonly isOtherAdmin = computed(() => {
    const t = this.user(); const a = this.authState.currentUser()?.id;
    return Boolean(t && a && t.role.code === 'ROLE_CODE_ADMIN' && t.id !== a);
  });
  readonly userId: string;

  constructor(route: ActivatedRoute, private readonly fb: NonNullableFormBuilder, private readonly adminUsersApi: AdminUsersApiService, private readonly authState: AuthStateService, private readonly router: Router) {
    document.title = 'Edit User | Portal';
    this.userId = route.snapshot.paramMap.get('userId') ?? '';
    this.load();
  }

  private load(): void {
    if (!this.userId) { this.loading.set(false); this.loadError.set('User ID is required'); return; }
    this.loading.set(true);
    this.adminUsersApi.getAdminUser(this.userId).subscribe({
      next: (u) => { this.loading.set(false); this.user.set(u); this.form.setValue({ username: u.username, firstName: u.firstName, lastName: u.lastName, dob: toDateInputValue(u.dob) }); },
      error: (e: unknown) => { this.loading.set(false); this.loadError.set(getErrorMessage(e, 'Unable to load user')); },
    });
  }

  submit(): void {
    this.submitted.set(true); this.submitError.set('');
    if (this.form.controls.dob.value > this.today) { this.form.controls.dob.setErrors({ futureDate: true }); }
    if (this.form.invalid || this.isOtherAdmin()) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.form.getRawValue();
    this.adminUsersApi.updateAdminUser(this.userId, { username: v.username, first_name: v.firstName, last_name: v.lastName, dob: v.dob }).subscribe({
      next: (u) => { this.saving.set(false); this.router.navigate(['/admin/users', u.id]); },
      error: (e: unknown) => { this.saving.set(false); this.submitError.set(getErrorMessage(e, 'Unable to update user')); },
    });
  }

  fieldError(name: 'username' | 'firstName' | 'lastName' | 'dob'): string | null {
    const c = this.form.controls[name];
    if (!c || (!c.touched && !this.submitted())) return null;
    if (c.hasError('required')) { if (name === 'firstName') return 'First name is required'; if (name === 'lastName') return 'Last name is required'; if (name === 'dob') return 'Date of birth is required'; return 'Username is required'; }
    if (c.hasError('minlength')) return 'Minimum 3 characters';
    if (c.hasError('maxlength')) return name === 'username' ? 'Maximum 50 characters' : 'Maximum 100 characters';
    if (c.hasError('futureDate')) return 'Date of birth cannot be in the future';
    return null;
  }
}
