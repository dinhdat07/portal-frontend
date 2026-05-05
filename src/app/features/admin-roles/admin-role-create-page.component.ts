import { Component, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminRolesApiService } from '../../core/api/admin-roles-api.service';
import { getErrorMessage } from '../../core/api/api.types';

@Component({
  selector: 'app-admin-role-create-page',
  imports: [ReactiveFormsModule, RouterLink, NgIf],
  template: `
    <div class="stack-lg">
      <section class="page-head">
        <div>
          <p class="eyebrow">Admin</p>
          <h1>Create policy</h1>
          <p>Define a new custom role to control workspace access.</p>
        </div>
        <a class="btn btn-secondary" routerLink="/admin/roles">Back to policies</a>
      </section>

      <article class="panel section-card">
        <form class="form-grid" [formGroup]="form" (ngSubmit)="submit()">
          <div class="alert danger" *ngIf="error()">{{ error() }}</div>
          
          <div class="grid-cols-2">
            <label class="field">
              <span>Policy Name</span>
              <input type="text" formControlName="name" placeholder="e.g., Content Editor" />
              <small class="field-error" *ngIf="fieldError('name')">{{ fieldError('name') }}</small>
            </label>
            <label class="field">
              <span>System Code</span>
              <input type="text" formControlName="code" placeholder="e.g., content_editor" />
              <small class="field-error" *ngIf="fieldError('code')">{{ fieldError('code') }}</small>
            </label>
          </div>

          <div class="btn-row" style="margin-top: var(--space-4);">
            <button type="submit" class="btn btn-primary" [disabled]="loading()">{{ loading() ? 'Creating...' : 'Create policy' }}</button>
            <a class="btn btn-secondary" routerLink="/admin/roles">Cancel</a>
          </div>
        </form>
      </article>
    </div>
  `,
})
export class AdminRoleCreatePageComponent {
  readonly loading = signal(false);
  readonly error = signal('');
  readonly submitted = signal(false);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    code: ['', [Validators.required, Validators.maxLength(50), Validators.pattern(/^[a-z0-9_]+$/)]],
  });

  constructor(
    private readonly fb: NonNullableFormBuilder,
    private readonly rolesApi: AdminRolesApiService,
    private readonly router: Router
  ) {
    document.title = 'Create Policy | Portal';
  }

  submit(): void {
    this.submitted.set(true);
    this.error.set('');
    
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const val = this.form.getRawValue();
    
    this.rolesApi.createRole(val).subscribe({
      next: (role) => {
        this.loading.set(false);
        this.router.navigate(['/admin/roles', role.id]);
      },
      error: (e: unknown) => {
        this.loading.set(false);
        this.error.set(getErrorMessage(e, 'Unable to create policy'));
      },
    });
  }

  fieldError(name: 'name' | 'code'): string | null {
    const c = this.form.controls[name];
    if (!c || (!c.touched && !this.submitted())) return null;
    if (c.hasError('required')) return `${name.charAt(0).toUpperCase()}${name.slice(1)} is required`;
    if (c.hasError('maxlength')) return name === 'name' ? 'Maximum 100 characters' : 'Maximum 50 characters';
    if (c.hasError('pattern')) return 'Code can only contain lowercase letters, numbers, and underscores';
    return null;
  }
}
