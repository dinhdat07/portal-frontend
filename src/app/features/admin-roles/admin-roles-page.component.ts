import { Component, signal, OnInit } from '@angular/core';
import { NgIf, NgFor, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminRolesApiService } from '../../core/api/admin-roles-api.service';
import { getErrorMessage } from '../../core/api/api.types';
import { Role } from '../../core/models/user.models';

@Component({
  selector: 'app-admin-roles-page',
  imports: [RouterLink, NgIf, NgFor, NgClass],
  template: `
    <div class="stack-lg">
      <section class="page-head">
        <div>
          <p class="eyebrow">Admin</p>
          <h1>Access Policies</h1>
          <p>Manage roles, configure access levels, and assign permissions for the workspace.</p>
        </div>
        <a class="btn btn-primary" routerLink="/admin/roles/new">Create role</a>
      </section>

      <div class="loading" *ngIf="loading()">Loading policies...</div>
      <div class="alert danger" *ngIf="error()">{{ error() }}</div>

      <article class="panel section-card" *ngIf="!loading() && !error()">
        <div class="empty" *ngIf="roles().length === 0">
          <h3>No policies found</h3>
          <p>Create your first role to get started.</p>
        </div>
        
        <div class="table-wrap" *ngIf="roles().length > 0">
          <table class="data-table desktop-only">
            <thead>
              <tr>
                <th>Role Name</th>
                <th>Code</th>
                <th>Type</th>
                <th>Permissions</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let role of roles()">
                <td><strong class="strong">{{ role.name }}</strong></td>
                <td><span class="muted">{{ role.code }}</span></td>
                <td>
                  <span class="badge" [ngClass]="role.isSystem ? 'badge-neutral' : 'badge-accent'">
                    {{ role.isSystem ? 'System' : 'Custom' }}
                  </span>
                </td>
                <td>{{ role.permissions ? role.permissions.length : 0 }} assigned</td>
                <td>
                  <a class="link-button" [routerLink]="['/admin/roles', role.id]">Manage policies</a>
                </td>
              </tr>
            </tbody>
          </table>
          <div class="mobile-list">
            <article class="mobile-item" *ngFor="let role of roles()">
              <div>
                <p class="strong">{{ role.name }}</p>
                <p class="muted">{{ role.code }} &bull; {{ role.permissions ? role.permissions.length : 0 }} perms</p>
              </div>
              <div class="badge-row">
                <span class="badge" [ngClass]="role.isSystem ? 'badge-neutral' : 'badge-accent'">
                  {{ role.isSystem ? 'System' : 'Custom' }}
                </span>
              </div>
              <div class="mobile-actions">
                <a class="link-button" [routerLink]="['/admin/roles', role.id]">Manage</a>
              </div>
            </article>
          </div>
        </div>
      </article>
    </div>
  `,
})
export class AdminRolesPageComponent implements OnInit {
  readonly loading = signal(true);
  readonly error = signal('');
  readonly roles = signal<Role[]>([]);

  constructor(private readonly rolesApi: AdminRolesApiService) {
    document.title = 'Access Policies | Portal';
  }

  ngOnInit(): void {
    this.loadRoles();
  }

  private loadRoles(): void {
    this.loading.set(true);
    this.error.set('');
    this.rolesApi.getRoles().subscribe({
      next: (roles) => {
        this.loading.set(false);
        this.roles.set(roles);
      },
      error: (e: unknown) => {
        this.loading.set(false);
        this.error.set(getErrorMessage(e, 'Unable to load policies'));
      },
    });
  }
}
