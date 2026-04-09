import { Component, computed, signal } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminUsersApiService, UserFilters } from '../../core/api/admin-users-api.service';
import { getErrorMessage } from '../../core/api/api.types';
import { Pagination, UserSummary } from '../../core/models/user.models';
import { appConfig } from '../../core/config/app-config';
import { AuthStateService } from '../../core/auth/auth-state.service';
import { formatDateTime } from '../../core/utils/date-utils';
import { roleBadgeClass, statusBadgeClass, statusLabel } from '../../core/utils/user-ui';

interface AdminUsersFilterForm {
  username: string;
  email: string;
  fullName: string;
  dob: string;
  role: '' | 'user' | 'admin';
  status: '' | 'active' | 'pending_verification' | 'deleted';
  includeDeleted: boolean;
}

@Component({
  selector: 'app-admin-users-page',
  imports: [ReactiveFormsModule, RouterLink, NgIf, NgFor, NgClass],
  template: `
    <div class="stack-lg">
      <section class="page-head">
        <div>
          <p class="eyebrow">Admin</p>
          <h1>User operations</h1>
          <p>Search users, review accounts, and manage access.</p>
        </div>
        <a class="btn btn-primary" routerLink="/admin/users/new" *ngIf="enableCreateUser">Create user</a>
      </section>

      <article class="panel section-card">
        <form class="form-grid" [formGroup]="filtersForm" (ngSubmit)="applyFilters()">
          <div class="grid-cols-3">
            <label class="field"><span>Username</span><input type="text" formControlName="username" placeholder="Search username" /></label>
            <label class="field"><span>Email</span><input type="text" formControlName="email" placeholder="Search email" /></label>
            <label class="field"><span>Full name</span><input type="text" formControlName="fullName" placeholder="Search full name" /></label>
            <label class="field"><span>Date of birth</span><input type="date" formControlName="dob" /></label>
            <label class="field">
              <span>Role</span>
              <select formControlName="role"><option value="">All roles</option><option value="user">user</option><option value="admin">admin</option></select>
            </label>
            <label class="field">
              <span>Status</span>
              <select formControlName="status"><option value="">All statuses</option><option value="active">active</option><option value="pending_verification">pending</option><option value="deleted">deleted</option></select>
            </label>
            <label class="field field-inline">
              <span>Filters</span>
              <label class="checkbox-wrap"><input type="checkbox" formControlName="includeDeleted" />Include deleted users</label>
            </label>
          </div>

          <div class="btn-row">
            <button type="submit" class="btn btn-primary">Apply filters</button>
            <button type="button" class="btn btn-secondary" (click)="resetFilters()">Reset</button>
          </div>
        </form>
      </article>

      <div class="loading" *ngIf="loading()">Loading users...</div>
      <div class="alert danger" *ngIf="error()">{{ error() }}</div>

      <article class="panel section-card" *ngIf="!loading() && !error()">
        <div class="empty" *ngIf="users().length === 0">
          <h3>No users matched the current filters</h3>
          <p>Try relaxing the filters or clearing the deleted-user constraint.</p>
        </div>

        <div class="table-wrap" *ngIf="users().length > 0">
          <table class="data-table desktop-only">
            <thead><tr><th>Identity</th><th>Role</th><th>Status</th><th>Updated</th><th>Action</th></tr></thead>
            <tbody>
              <tr *ngFor="let user of users()">
                <td><p class="strong">{{ user.firstName }} {{ user.lastName }}</p><p class="muted">{{ user.email }}</p><p class="muted">@{{ user.username }}</p></td>
                <td><span [ngClass]="roleClass(user.role)">{{ user.role }}</span></td>
                <td><span [ngClass]="statusClass(user.status)">{{ statusText(user.status) }}</span></td>
                <td>{{ formatDateTimeValue(user.updatedAt) }}</td>
                <td>
                  <button class="link-button" *ngIf="user.status === 'deleted'" [disabled]="restoreLoading()" (click)="openRestoreDialog(user)">{{ restoreLoading() ? 'Restoring...' : 'Restore' }}</button>
                  <span class="muted" *ngIf="user.role === 'admin' && user.id === currentUserId()">Current admin</span>
                  <a class="link-button" *ngIf="user.status !== 'deleted' && !(user.role === 'admin' && user.id === currentUserId())" [routerLink]="['/admin/users', user.id]">View details</a>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="mobile-list">
            <article class="mobile-item" *ngFor="let user of users()">
              <div><p class="strong">{{ user.firstName }} {{ user.lastName }}</p><p class="muted">{{ user.email }}</p></div>
              <div class="badge-row"><span [ngClass]="roleClass(user.role)">{{ user.role }}</span><span [ngClass]="statusClass(user.status)">{{ statusText(user.status) }}</span></div>
              <div class="mobile-actions">
                <button class="link-button" *ngIf="user.status === 'deleted'" [disabled]="restoreLoading()" (click)="openRestoreDialog(user)">{{ restoreLoading() ? 'Restoring...' : 'Restore' }}</button>
                <span class="muted" *ngIf="user.role === 'admin' && user.id === currentUserId()">Current admin</span>
                <a class="link-button" *ngIf="user.status !== 'deleted' && !(user.role === 'admin' && user.id === currentUserId())" [routerLink]="['/admin/users', user.id]">Open</a>
              </div>
            </article>
          </div>
        </div>
      </article>

      <section class="panel pagination" *ngIf="meta().total > 0">
        <p>Page {{ meta().page }} of {{ totalPages() }} - {{ meta().total }} total users</p>
        <div class="btn-row">
          <button class="btn btn-secondary" [disabled]="meta().page <= 1" (click)="prevPage()">Previous</button>
          <button class="btn btn-secondary" [disabled]="meta().page >= totalPages()" (click)="nextPage()">Next</button>
        </div>
      </section>

      <div class="dialog-backdrop" *ngIf="restoreTarget() as target">
        <section class="dialog">
          <h3>Restore this user?</h3>
          <p>{{ target.firstName }} {{ target.lastName }} will regain access and return to active status.</p>
          <div class="btn-row">
            <button class="btn btn-secondary" [disabled]="restoreLoading()" (click)="restoreTarget.set(null)">Cancel</button>
            <button class="btn btn-primary" [disabled]="restoreLoading()" (click)="confirmRestore()">{{ restoreLoading() ? 'Working...' : 'Restore user' }}</button>
          </div>
        </section>
      </div>
    </div>
  `,
})
export class AdminUsersPageComponent {
  readonly enableCreateUser = appConfig.featureFlags.enableAdminCreateUser;
  readonly loading = signal(true);
  readonly error = signal('');
  readonly users = signal<UserSummary[]>([]);
  readonly meta = signal<Pagination>({ page: 1, pageSize: 20, total: 0 });
  readonly restoreTarget = signal<UserSummary | null>(null);
  readonly restoreLoading = signal(false);

  readonly currentUserId = computed(() => this.authState.currentUser()?.id ?? '');
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.meta().total / this.meta().pageSize)));

  readonly filtersForm = this.fb.group<AdminUsersFilterForm>({
    username: '',
    email: '',
    fullName: '',
    dob: '',
    role: '',
    status: '',
    includeDeleted: false,
  });

  readonly currentFilters = signal<UserFilters>({ page: 1, pageSize: 20, role: '', status: '', includeDeleted: false });

  constructor(
    private readonly fb: NonNullableFormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly adminUsersApi: AdminUsersApiService,
    private readonly authState: AuthStateService,
  ) {
    document.title = 'Admin Users | Portal Frontend';
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const filters = this.parseFilters(params);
      this.currentFilters.set(filters);
      this.filtersForm.patchValue({
        username: filters.username || '',
        email: filters.email || '',
        fullName: filters.fullName || '',
        dob: filters.dob || '',
        role: filters.role || '',
        status: filters.status || '',
        includeDeleted: Boolean(filters.includeDeleted),
      }, { emitEvent: false });
      this.loadUsers(filters);
    });
  }

  applyFilters(): void {
    const value = this.filtersForm.getRawValue();
    const current = this.currentFilters();
    this.navigateWithFilters({
      page: 1,
      pageSize: current.pageSize || 20,
      username: value.username || undefined,
      email: value.email || undefined,
      fullName: value.fullName || undefined,
      dob: value.dob || undefined,
      role: value.role || '',
      status: value.status || '',
      includeDeleted: value.includeDeleted,
    });
  }

  resetFilters(): void {
    this.navigateWithFilters({ page: 1, pageSize: 20, role: '', status: '', includeDeleted: false });
  }

  prevPage(): void {
    const current = this.currentFilters();
    if (current.page > 1) {
      this.navigateWithFilters({ ...current, page: current.page - 1 });
    }
  }

  nextPage(): void {
    const current = this.currentFilters();
    if (current.page < this.totalPages()) {
      this.navigateWithFilters({ ...current, page: current.page + 1 });
    }
  }

  openRestoreDialog(user: UserSummary): void {
    this.restoreTarget.set(user);
  }

  confirmRestore(): void {
    const target = this.restoreTarget();
    if (!target || this.restoreLoading()) {
      return;
    }

    this.restoreLoading.set(true);
    this.adminUsersApi.restoreAdminUser(target.id).subscribe({
      next: () => {
        this.restoreLoading.set(false);
        this.restoreTarget.set(null);
        this.loadUsers(this.currentFilters());
      },
      error: (error: unknown) => {
        this.restoreLoading.set(false);
        this.error.set(getErrorMessage(error, 'Unable to restore user'));
      },
    });
  }

  private parseFilters(params: ParamMap): UserFilters {
    const page = Number(params.get('page') || '1');
    const pageSize = Number(params.get('page_size') || '20');
    return {
      page: Number.isFinite(page) && page > 0 ? page : 1,
      pageSize: Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 20,
      username: params.get('username') || undefined,
      email: params.get('email') || undefined,
      fullName: params.get('full_name') || undefined,
      dob: params.get('dob') || undefined,
      role: (params.get('role') as UserFilters['role']) || '',
      status: (params.get('status') as UserFilters['status']) || '',
      includeDeleted: params.get('include_deleted') === 'true',
    };
  }

  private navigateWithFilters(filters: UserFilters): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        page: filters.page,
        page_size: filters.pageSize,
        username: filters.username || null,
        email: filters.email || null,
        full_name: filters.fullName || null,
        dob: filters.dob || null,
        role: filters.role || null,
        status: filters.status || null,
        include_deleted: filters.includeDeleted ? 'true' : null,
      },
    });
  }

  private loadUsers(filters: UserFilters): void {
    this.loading.set(true);
    this.error.set('');
    this.adminUsersApi.getAdminUsers(filters).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.users.set(response.data);
        this.meta.set(response.meta);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.error.set(getErrorMessage(error, 'Unable to load users'));
      },
    });
  }

  roleClass = roleBadgeClass;
  statusClass = statusBadgeClass;
  statusText = statusLabel;
  formatDateTimeValue = formatDateTime;
}
