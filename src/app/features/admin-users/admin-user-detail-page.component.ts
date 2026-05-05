import { Component, computed, signal, OnInit } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminUsersApiService } from '../../core/api/admin-users-api.service';
import { AdminRolesApiService } from '../../core/api/admin-roles-api.service';
import { getErrorMessage } from '../../core/api/api.types';
import { AuthStateService } from '../../core/auth/auth-state.service';
import { Role, UserSummary } from '../../core/models/user.models';
import { appConfig } from '../../core/config/app-config';
import { formatDate, formatDateTime } from '../../core/utils/date-utils';
import { roleBadgeClass, statusBadgeClass, statusLabel } from '../../core/utils/user-ui';

@Component({
  selector: 'app-admin-user-detail-page',
  imports: [RouterLink, NgIf, NgFor, NgClass, FormsModule],
  template: `
    <div class="stack-lg">
      <section class="page-head">
        <div><p class="eyebrow">Admin</p><h1 *ngIf="user() as u">{{ u.firstName }} {{ u.lastName }}</h1><h1 *ngIf="!user()">User details</h1><p>Review this account, update access, and manage account status.</p></div>
        <a class="btn btn-secondary" routerLink="/admin/users">Back to users</a>
      </section>
      <div class="loading" *ngIf="loading()">Loading user details...</div>
      <div class="alert danger" *ngIf="loadError()">{{ loadError() }}</div>
      <div class="grid-main" *ngIf="!loading() && user() as currentUser">
        <div class="stack-md">
          <article class="panel section-card">
            <div class="section-head">
              <div><p class="eyebrow-muted">Identity snapshot</p><h2>{{ currentUser.email }}</h2></div>
              <div class="badge-row"><span [ngClass]="roleClass(currentUser.role.code)">{{ currentUser.role.name }}</span><span [ngClass]="statusClass(currentUser.status)">{{ statusText(currentUser.status) }}</span></div>
            </div>
            <div class="details-grid">
              <div class="detail-row"><span>Username</span><strong>&#64;{{ currentUser.username }}</strong></div>
              <div class="detail-row"><span>Date of birth</span><strong>{{ formatDateValue(currentUser.dob) }}</strong></div>
              <div class="detail-row"><span>Created</span><strong>{{ formatDateTimeValue(currentUser.createdAt) }}</strong></div>
              <div class="detail-row"><span>Updated</span><strong>{{ formatDateTimeValue(currentUser.updatedAt) }}</strong></div>
              <div class="detail-row"><span>Deleted at</span><strong>{{ formatDateTimeValue(currentUser.deletedAt) }}</strong></div>
              <div class="detail-row"><span>Deleted by</span><strong>{{ currentUser.deletedBy || 'Unavailable' }}</strong></div>
            </div>
          </article>
          <article class="panel section-card">
            <h3>Access controls</h3>
            <p>Choose the role this user should have in the workspace.</p>
            <div class="alert warning" *ngIf="isOtherAdmin()">Other admin accounts are read-only. You cannot change this admin from here.</div>
            <div class="alert danger" *ngIf="roleError()">{{ roleError() }}</div>
            <div class="btn-row align-end" style="margin-top: var(--space-3);">
              <label class="field grow"><span>Role</span>
                <select [(ngModel)]="selectedRoleCode" [disabled]="isOtherAdmin() || roleSaving()">
                  <option *ngFor="let r of roles()" [value]="r.code">{{ r.name }}</option>
                </select>
              </label>
              <button class="btn btn-primary" id="admin-save-role-btn" [disabled]="isOtherAdmin() || roleSaving() || selectedRoleCode === currentUser.role.code" (click)="saveRole()">{{ roleSaving() ? 'Saving...' : 'Save role' }}</button>
            </div>
          </article>
        </div>
        <div class="stack-md">
          <article class="panel section-card">
            <h3>Lifecycle actions</h3>
            <p>Deactivate an account when needed, or restore it later.</p>
            <div class="alert danger" *ngIf="stateError()">{{ stateError() }}</div>
            <div class="stack-sm" style="margin-top: var(--space-3);">
              <button *ngIf="currentUser.status === 'deleted'; else deleteButton" class="btn btn-primary" [disabled]="isOtherAdmin() || stateSaving()" (click)="dialog.set('restore')">Restore user</button>
              <ng-template #deleteButton><button class="btn btn-danger" id="admin-delete-user-btn" [disabled]="isOtherAdmin() || stateSaving()" (click)="dialog.set('delete')">Delete user</button></ng-template>
              <a *ngIf="enableUserEdit" class="btn btn-secondary" [routerLink]="['/admin/users', currentUser.id, 'edit']" [class.disabled]="isOtherAdmin()">Edit user</a>
            </div>
          </article>
          <article class="panel section-card">
            <h3>Admin notes</h3>
            <ul>
              <li>Use role changes carefully because they affect access immediately.</li>
              <li>Newly created accounts may stay pending until setup is completed.</li>
              <li>Deleted users can be restored from this page at any time.</li>
              <li>Other admin accounts are read-only for safety.</li>
            </ul>
          </article>
        </div>
      </div>
      <div class="dialog-backdrop" *ngIf="dialog() === 'delete'">
        <section class="dialog"><h3>Delete this user?</h3><p>This user will lose access, but you can restore the account later.</p>
          <div class="btn-row"><button class="btn btn-secondary" [disabled]="stateSaving()" (click)="dialog.set(null)">Cancel</button><button class="btn btn-danger" [disabled]="stateSaving()" (click)="deleteUser()">{{ stateSaving() ? 'Working...' : 'Delete user' }}</button></div>
        </section>
      </div>
      <div class="dialog-backdrop" *ngIf="dialog() === 'restore'">
        <section class="dialog"><h3>Restore this user?</h3><p>This user will regain access and return to active status.</p>
          <div class="btn-row"><button class="btn btn-secondary" [disabled]="stateSaving()" (click)="dialog.set(null)">Cancel</button><button class="btn btn-primary" [disabled]="stateSaving()" (click)="restoreUser()">{{ stateSaving() ? 'Working...' : 'Restore user' }}</button></div>
        </section>
      </div>
    </div>
  `,
})
export class AdminUserDetailPageComponent implements OnInit {
  readonly enableUserEdit = appConfig.featureFlags.enableAdminUserEdit;
  readonly loading = signal(true);
  readonly loadError = signal('');
  readonly roleError = signal('');
  readonly stateError = signal('');
  readonly roleSaving = signal(false);
  readonly stateSaving = signal(false);
  readonly user = signal<UserSummary | null>(null);
  readonly roles = signal<Role[]>([]);
  readonly dialog = signal<'delete' | 'restore' | null>(null);
  selectedRoleCode: string = '';
  readonly isOtherAdmin = computed(() => { const u = this.user(); const a = this.authState.currentUser()?.id; return Boolean(u && a && u.role.code === 'ROLE_CODE_ADMIN' && u.id !== a); });
  private readonly userId: string;

  constructor(route: ActivatedRoute, private readonly router: Router, private readonly adminUsersApi: AdminUsersApiService, private readonly adminRolesApi: AdminRolesApiService, private readonly authState: AuthStateService) {
    document.title = 'Admin User Detail | Portal';
    this.userId = route.snapshot.paramMap.get('userId') ?? '';
  }

  ngOnInit(): void {
    this.adminRolesApi.getRoles().subscribe(roles => this.roles.set(roles));
    this.load();
  }

  private load(): void {
    if (!this.userId) { this.loadError.set('User ID is required'); this.loading.set(false); return; }
    this.loading.set(true);
    this.adminUsersApi.getAdminUser(this.userId).subscribe({
      next: (u) => { this.loading.set(false); this.user.set(u); this.selectedRoleCode = u.role.code; },
      error: (e: unknown) => { this.loading.set(false); this.loadError.set(getErrorMessage(e, 'Unable to load user details')); },
    });
  }

  saveRole(): void {
    const u = this.user();
    if (!u || this.isOtherAdmin() || this.selectedRoleCode === u.role.code) return;
    this.roleSaving.set(true); this.roleError.set('');
    this.adminUsersApi.updateAdminUserRole(this.userId, this.selectedRoleCode).subscribe({
      next: (user) => { this.roleSaving.set(false); this.user.set(user); },
      error: (e: unknown) => { this.roleSaving.set(false); this.roleError.set(getErrorMessage(e, 'Unable to update role')); },
    });
  }

  deleteUser(): void {
    if (this.isOtherAdmin()) return;
    this.stateSaving.set(true); this.stateError.set('');
    this.adminUsersApi.deleteAdminUser(this.userId).subscribe({
      next: () => { this.stateSaving.set(false); this.dialog.set(null); this.router.navigateByUrl('/admin/users'); },
      error: (e: unknown) => { this.stateSaving.set(false); this.stateError.set(getErrorMessage(e, 'Unable to update user state')); },
    });
  }

  restoreUser(): void {
    if (this.isOtherAdmin()) return;
    this.stateSaving.set(true); this.stateError.set('');
    this.adminUsersApi.restoreAdminUser(this.userId).subscribe({
      next: (u) => { this.stateSaving.set(false); this.dialog.set(null); this.user.set(u); },
      error: (e: unknown) => { this.stateSaving.set(false); this.stateError.set(getErrorMessage(e, 'Unable to update user state')); },
    });
  }

  roleClass = roleBadgeClass; statusClass = statusBadgeClass; statusText = statusLabel;
  formatDateValue = formatDate; formatDateTimeValue = formatDateTime;
}
