import { Component, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ServersApiService } from '../../core/api/servers-api.service';
import { getErrorMessage } from '../../core/api/api.types';

@Component({
  selector: 'app-server-create-page',
  imports: [ReactiveFormsModule, RouterLink, NgIf],
  template: `
    <div class="stack-lg">
      <section class="page-head">
        <div>
          <p class="eyebrow">Infrastructure</p>
          <h1>Add Server</h1>
          <p>Register a new server for monitoring.</p>
        </div>
      </section>

      <div class="alert alert-danger" *ngIf="errorMessage()">{{ errorMessage() }}</div>

      <article class="panel section-card">
        <form class="stack" [formGroup]="form" (ngSubmit)="submit()">
          <label class="field">
            <span>Server Name <span class="required">*</span></span>
            <input type="text" formControlName="serverName" placeholder="e.g. prod-web-01" maxlength="255" />
            <span class="field-error" *ngIf="form.controls.serverName.touched && form.controls.serverName.hasError('required')">Server name is required.</span>
            <span class="field-error" *ngIf="form.controls.serverName.touched && form.controls.serverName.hasError('maxlength')">Maximum 255 characters.</span>
          </label>

          <label class="field">
            <span>IPv4 Address <span class="required">*</span></span>
            <input type="text" formControlName="ipv4" placeholder="e.g. 192.168.1.100" />
            <span class="field-error" *ngIf="form.controls.ipv4.touched && form.controls.ipv4.hasError('required')">IP address is required.</span>
            <span class="field-error" *ngIf="form.controls.ipv4.touched && form.controls.ipv4.hasError('pattern')">Enter a valid IPv4 address (e.g. 192.168.1.100).</span>
          </label>

          <div class="btn-row">
            <button type="submit" class="btn btn-primary" [disabled]="form.invalid || isSubmitting()">
              {{ isSubmitting() ? 'Creating...' : 'Create Server' }}
            </button>
            <a class="btn btn-secondary" routerLink="/servers/inventory">Cancel</a>
          </div>
        </form>
      </article>
    </div>
  `,
})
export class ServerCreatePageComponent {
  readonly form = this.fb.group({
    serverName: ['', [Validators.required, Validators.maxLength(255)]],
    ipv4: ['', [Validators.required, Validators.pattern(/^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/)]],
  });

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  constructor(
    private readonly fb: NonNullableFormBuilder,
    private readonly serversApi: ServersApiService,
    private readonly router: Router,
  ) {}

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const raw = this.form.getRawValue();
    this.serversApi.createServer({ server_name: raw.serverName, ipv4: raw.ipv4 }).subscribe({
      next: (server) => {
        this.isSubmitting.set(false);
        this.router.navigate(['/servers', server.id]);
      },
      error: (err) => {
        this.errorMessage.set(getErrorMessage(err));
        this.isSubmitting.set(false);
      },
    });
  }
}
