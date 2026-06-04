import { Component, signal, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ServersApiService } from '../../core/api/servers-api.service';
import { getErrorMessage } from '../../core/api/api.types';
import { Server } from '../../core/models/server.models';

@Component({
  selector: 'app-server-edit-page',
  imports: [ReactiveFormsModule, RouterLink, NgIf],
  template: `
    <div class="stack-lg">
      <section class="page-head">
        <div>
          <p class="eyebrow">Infrastructure</p>
          <h1>Edit Server</h1>
          <p>Update server configuration for {{ originalServer()?.name }}.</p>
        </div>
      </section>

      <div class="alert alert-danger" *ngIf="errorMessage()">{{ errorMessage() }}</div>
      <div class="alert alert-info" *ngIf="isLoading()">Loading server details...</div>

      <article class="panel section-card" *ngIf="!isLoading()">
        <form class="stack" [formGroup]="form" (ngSubmit)="submit()">
          <label class="field">
            <span>Server Name <span class="required">*</span></span>
            <input type="text" formControlName="serverName" placeholder="e.g. prod-web-01" maxlength="255" />
          </label>

          <label class="field">
            <span>IPv4 Address <span class="required">*</span></span>
            <input type="text" formControlName="ipv4" placeholder="e.g. 192.168.1.100" />
            <span class="field-error" *ngIf="form.controls.ipv4.touched && form.controls.ipv4.hasError('pattern')">Enter a valid IPv4 address.</span>
          </label>

          <div class="btn-row">
            <button type="submit" class="btn btn-primary" [disabled]="form.invalid || form.pristine || isSubmitting()">
              {{ isSubmitting() ? 'Saving...' : 'Save Changes' }}
            </button>
            <a class="btn btn-secondary" [routerLink]="['/servers', serverId]">Cancel</a>
          </div>
        </form>
      </article>
    </div>
  `,
})
export class ServerEditPageComponent implements OnInit {
  readonly serverId: string;
  readonly originalServer = signal<Server | null>(null);
  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.group({
    serverName: ['', [Validators.required, Validators.maxLength(255)]],
    ipv4: ['', [Validators.required, Validators.pattern(/^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/)]],
  });

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly fb: NonNullableFormBuilder,
    private readonly serversApi: ServersApiService,
  ) {
    this.serverId = this.route.snapshot.paramMap.get('serverId')!;
  }

  ngOnInit(): void {
    this.serversApi.getServer(this.serverId).subscribe({
      next: (server) => {
        this.originalServer.set(server);
        this.form.setValue({ serverName: server.name, ipv4: server.ipv4 });
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(getErrorMessage(err));
        this.isLoading.set(false);
      },
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const raw = this.form.getRawValue();
    this.serversApi.updateServer(this.serverId, { server_name: raw.serverName, ipv4: raw.ipv4 }).subscribe({
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
