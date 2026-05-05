import { Component, computed, signal, OnInit } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminRolesApiService } from '../../core/api/admin-roles-api.service';
import { getErrorMessage } from '../../core/api/api.types';
import { Permission, Role } from '../../core/models/user.models';

@Component({
  selector: 'app-admin-role-detail-page',
  imports: [RouterLink, NgIf, NgFor, NgClass],
  template: `
    <div class="stack-lg">
      <section class="page-head">
        <div>
          <p class="eyebrow">Admin</p>
          <h1 *ngIf="role() as r">{{ r.name }}</h1>
          <h1 *ngIf="!role()">Policy details</h1>
          <p>Review role configuration and assign explicit permissions.</p>
        </div>
        <a class="btn btn-secondary" routerLink="/admin/roles">Back to policies</a>
      </section>

      <div class="loading" *ngIf="loading()">Loading policy details...</div>
      <div class="alert danger" *ngIf="loadError()">{{ loadError() }}</div>

      <div class="grid-main" *ngIf="!loading() && role() as currentRole">
        <div class="stack-md">
          <article class="panel section-card">
            <div class="section-head">
              <div>
                <p class="eyebrow-muted">Role configuration</p>
                <h2>{{ currentRole.name }}</h2>
              </div>
              <div class="badge-row">
                <span class="badge" [ngClass]="currentRole.isSystem ? 'badge-neutral' : 'badge-accent'">
                  {{ currentRole.isSystem ? 'System' : 'Custom' }}
                </span>
              </div>
            </div>
            <div class="details-grid">
              <div class="detail-row"><span>Code</span><strong>{{ currentRole.code }}</strong></div>
              <div class="detail-row"><span>System Role</span><strong>{{ currentRole.isSystem ? 'Yes (immutable)' : 'No' }}</strong></div>
              <div class="detail-row"><span>Total Permissions</span><strong>{{ currentRole.permissions ? currentRole.permissions.length : 0 }}</strong></div>
            </div>
          </article>

          <article class="panel section-card">
            <h3>Permissions mapping</h3>
            <p>Grant or revoke specific actions for users bound to this policy.</p>
            <div class="alert warning" *ngIf="currentRole.isSystem">System roles cannot be modified. They ensure core functionality.</div>
            
            <div class="table-wrap" style="margin-top: var(--space-4);">
              <table class="data-table desktop-only">
                <thead><tr><th>Permission</th><th>Code</th><th class="text-right">Action</th></tr></thead>
                <tbody>
                  <tr *ngFor="let perm of allPermissions()">
                    <td><strong class="strong">{{ perm.name }}</strong></td>
                    <td><span class="muted">{{ perm.code }}</span></td>
                    <td class="text-right">
                      <button 
                        *ngIf="!hasPermission(perm.id)"
                        class="btn btn-secondary" 
                        [disabled]="currentRole.isSystem || savingId() === perm.id" 
                        (click)="assignPermission(perm.id)">
                        {{ savingId() === perm.id ? 'Working...' : 'Assign' }}
                      </button>
                      <button 
                        *ngIf="hasPermission(perm.id)"
                        class="btn btn-primary" 
                        [disabled]="currentRole.isSystem || savingId() === perm.id" 
                        (click)="removePermission(perm.id)">
                        {{ savingId() === perm.id ? 'Working...' : 'Assigned (Revoke)' }}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div class="mobile-list">
                <article class="mobile-item" *ngFor="let perm of allPermissions()">
                  <div>
                    <p class="strong">{{ perm.name }}</p>
                    <p class="muted">{{ perm.code }}</p>
                  </div>
                  <div class="mobile-actions">
                    <button 
                      *ngIf="!hasPermission(perm.id)"
                      class="btn btn-secondary" 
                      [disabled]="currentRole.isSystem || savingId() === perm.id" 
                      (click)="assignPermission(perm.id)">
                      {{ savingId() === perm.id ? '...' : 'Assign' }}
                    </button>
                    <button 
                      *ngIf="hasPermission(perm.id)"
                      class="btn btn-primary" 
                      [disabled]="currentRole.isSystem || savingId() === perm.id" 
                      (click)="removePermission(perm.id)">
                      {{ savingId() === perm.id ? '...' : 'Revoke' }}
                    </button>
                  </div>
                </article>
              </div>
            </div>
          </article>
        </div>

        <div class="stack-md">
          <article class="panel section-card">
            <h3>Danger zone</h3>
            <p>Delete this custom role permanently.</p>
            <div class="alert danger" *ngIf="deleteError()">{{ deleteError() }}</div>
            <div class="stack-sm" style="margin-top: var(--space-3);">
              <button class="btn btn-danger" [disabled]="currentRole.isSystem || deleting()" (click)="dialog.set('delete')">Delete role</button>
            </div>
            <p class="muted" style="margin-top: var(--space-2); font-size: 13px;" *ngIf="currentRole.isSystem">System roles cannot be deleted.</p>
          </article>
        </div>
      </div>

      <div class="dialog-backdrop" *ngIf="dialog() === 'delete'">
        <section class="dialog">
          <h3>Delete this role?</h3>
          <p>This action cannot be undone. Users with this role must be reassigned.</p>
          <div class="alert danger" *ngIf="deleteError()">{{ deleteError() }}</div>
          <div class="btn-row">
            <button class="btn btn-secondary" [disabled]="deleting()" (click)="dialog.set(null)">Cancel</button>
            <button class="btn btn-danger" [disabled]="deleting()" (click)="deleteRole()">{{ deleting() ? 'Working...' : 'Delete role' }}</button>
          </div>
        </section>
      </div>
    </div>
  `,
})
export class AdminRoleDetailPageComponent implements OnInit {
  readonly loading = signal(true);
  readonly loadError = signal('');
  readonly role = signal<Role | null>(null);
  readonly allPermissions = signal<Permission[]>([]);
  readonly dialog = signal<'delete' | null>(null);
  readonly deleting = signal(false);
  readonly deleteError = signal('');
  readonly savingId = signal<string | null>(null);
  
  private readonly roleId: string;

  constructor(
    route: ActivatedRoute, 
    private readonly router: Router, 
    private readonly rolesApi: AdminRolesApiService
  ) {
    document.title = 'Policy Details | Portal';
    this.roleId = route.snapshot.paramMap.get('roleId') ?? '';
  }

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    if (!this.roleId) { 
      this.loadError.set('Role ID is required'); 
      this.loading.set(false); 
      return; 
    }
    
    this.loading.set(true);
    
    this.rolesApi.getRoles().subscribe({
      next: (roles) => {
        const found = roles.find(r => r.id === this.roleId);
        if (found) {
          this.role.set(found);
          this.loadPermissions();
        } else {
          this.loadError.set('Role not found');
          this.loading.set(false);
        }
      },
      error: (e: unknown) => { 
        this.loading.set(false); 
        this.loadError.set(getErrorMessage(e, 'Unable to load roles')); 
      },
    });
  }

  private loadPermissions(): void {
    this.rolesApi.getPermissions().subscribe({
      next: (perms) => {
        this.allPermissions.set(perms);
        this.loading.set(false);
      },
      error: (e: unknown) => {
        this.loading.set(false); 
        this.loadError.set(getErrorMessage(e, 'Unable to load permissions'));
      }
    });
  }

  hasPermission(permId: string): boolean {
    const r = this.role();
    return r ? (r.permissions || []).some(p => p.id === permId) : false;
  }

  assignPermission(permId: string): void {
    if (this.savingId()) return;
    this.savingId.set(permId);
    this.rolesApi.assignPermission(this.roleId, permId).subscribe({
      next: () => {
        this.savingId.set(null);
        this.reloadRole();
      },
      error: (e: unknown) => {
        this.savingId.set(null);
        alert(getErrorMessage(e, 'Failed to assign permission'));
      }
    });
  }

  removePermission(permId: string): void {
    if (this.savingId()) return;
    this.savingId.set(permId);
    this.rolesApi.removePermission(this.roleId, permId).subscribe({
      next: () => {
        this.savingId.set(null);
        this.reloadRole();
      },
      error: (e: unknown) => {
        this.savingId.set(null);
        alert(getErrorMessage(e, 'Failed to remove permission'));
      }
    });
  }

  private reloadRole(): void {
    this.rolesApi.getRoles().subscribe({
      next: (roles) => {
        const found = roles.find(r => r.id === this.roleId);
        if (found) {
          this.role.set(found);
        }
      }
    });
  }

  deleteRole(): void {
    this.deleting.set(true);
    this.deleteError.set('');
    
    this.rolesApi.deleteRole(this.roleId).subscribe({
      next: () => {
        this.deleting.set(false);
        this.dialog.set(null);
        this.router.navigateByUrl('/admin/roles');
      },
      error: (e: unknown) => {
        this.deleting.set(false);
        this.deleteError.set(getErrorMessage(e, 'Unable to delete role'));
      }
    });
  }
}
