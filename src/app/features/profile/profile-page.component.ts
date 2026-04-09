import { Component, signal } from '@angular/core';
import { NgClass, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UsersApiService } from '../../core/api/users-api.service';
import { getErrorMessage } from '../../core/api/api.types';
import { UserSummary } from '../../core/models/user.models';
import { AuthStateService } from '../../core/auth/auth-state.service';
import { appConfig } from '../../core/config/app-config';
import { formatDate, formatDateTime } from '../../core/utils/date-utils';
import { roleBadgeClass, statusBadgeClass, statusLabel } from '../../core/utils/user-ui';

@Component({
  selector: 'app-profile-page',
  imports: [NgIf, RouterLink, NgClass],
  template: `
    <div class="stack-lg">
      <section class="page-head">
        <div>
          <p class="eyebrow">Account</p>
          <h1>Profile overview</h1>
          <p>Review your current account details and jump into editing or password updates.</p>
        </div>
        <a
          class="btn btn-primary"
          *ngIf="enableProfileEdit; else securityCta"
          routerLink="/account/profile/edit"
        >
          Edit profile
        </a>
        <ng-template #securityCta>
          <a class="btn btn-primary" routerLink="/account/security">Change password</a>
        </ng-template>
      </section>

      <div class="loading" *ngIf="loading()">Loading profile...</div>
      <div class="alert danger" *ngIf="error()">{{ error() }}</div>

      <div class="grid-main" *ngIf="!loading() && user() as currentUser">
        <article class="panel section-card">
          <div class="section-head">
            <div>
              <h2>{{ currentUser.firstName }} {{ currentUser.lastName }}</h2>
              <p>@{{ currentUser.username }}</p>
            </div>
            <div class="badge-row">
              <span [ngClass]="roleClass(currentUser.role)">{{ currentUser.role }}</span>
              <span [ngClass]="statusClass(currentUser.status)">{{ statusText(currentUser.status) }}</span>
            </div>
          </div>

          <div class="details-grid">
            <div class="detail-row"><span>Email</span><strong>{{ currentUser.email }}</strong></div>
            <div class="detail-row"><span>Date of birth</span><strong>{{ formatDateValue(currentUser.dob) }}</strong></div>
            <div class="detail-row"><span>Created</span><strong>{{ formatDateTimeValue(currentUser.createdAt) }}</strong></div>
            <div class="detail-row"><span>Updated</span><strong>{{ formatDateTimeValue(currentUser.updatedAt) }}</strong></div>
            <div class="detail-row"><span>Email verified</span><strong>{{ formatDateTimeValue(currentUser.emailVerifiedAt) }}</strong></div>
            <div class="detail-row"><span>Last login</span><strong>{{ formatDateTimeValue(currentUser.lastLoginAt) }}</strong></div>
          </div>
        </article>

        <article class="panel section-card quick-actions">
          <div>
            <p class="eyebrow-muted">Quick actions</p>
            <h3>Keep your account secure</h3>
          </div>
          <ul>
            <li>Update your profile whenever your personal details change.</li>
            <li>Change your password regularly to keep your account protected.</li>
            <li>Check last login activity if you suspect unusual access.</li>
          </ul>
          <a class="btn btn-primary" routerLink="/account/security">Go to security settings</a>
        </article>
      </div>
    </div>
  `,
})
export class ProfilePageComponent {
  readonly enableProfileEdit = appConfig.featureFlags.enableProfileEdit;
  readonly loading = signal(true);
  readonly error = signal('');
  readonly user = signal<UserSummary | null>(null);

  constructor(
    private readonly usersApi: UsersApiService,
    private readonly authState: AuthStateService,
  ) {
    document.title = 'Profile | Portal Frontend';
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.error.set('');

    this.usersApi.getMyProfile().subscribe({
      next: (user) => {
        this.loading.set(false);
        this.user.set(user);

        const sessionUser = this.authState.currentUser();
        if (!sessionUser || sessionUser.updatedAt !== user.updatedAt) {
          this.authState.updateUser(user);
        }
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.error.set(getErrorMessage(error, 'Unable to load your profile'));
      },
    });
  }

  roleClass = roleBadgeClass;
  statusClass = statusBadgeClass;
  statusText = statusLabel;
  formatDateValue = formatDate;
  formatDateTimeValue = formatDateTime;
}
