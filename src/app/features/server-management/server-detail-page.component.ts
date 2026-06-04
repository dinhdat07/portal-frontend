import { Component, signal, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ServersApiService } from '../../core/api/servers-api.service';
import { getErrorMessage } from '../../core/api/api.types';
import { Server } from '../../core/models/server.models';
import { formatDateTime } from '../../core/utils/date-utils';
import { ServerStatusBadgeComponent } from './shared/server-status-badge.component';

@Component({
  selector: 'app-server-detail-page',
  imports: [RouterLink, NgIf, ServerStatusBadgeComponent],
  template: `
    <div class="stack-lg">
      <section class="page-head">
        <div>
          <p class="eyebrow">Infrastructure</p>
          <h1>{{ server()?.name || 'Server Detail' }}</h1>
          <p>
            <a routerLink="/servers/inventory" class="muted">Server Inventory</a> &rsaquo; {{ server()?.name }}
          </p>
        </div>
        <div class="btn-group">
          <a class="btn btn-secondary" [routerLink]="['/servers', serverId, 'edit']">Edit</a>
          <button class="btn btn-danger" [disabled]="isDeleting()" (click)="confirmDelete()">
            {{ isDeleting() ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </section>

      <div class="alert alert-danger" *ngIf="errorMessage()">{{ errorMessage() }}</div>
      <div class="alert alert-info" *ngIf="isLoading()">Loading server details...</div>

      <ng-container *ngIf="server() as srv">
        <div class="grid-2col">
          <article class="panel section-card">
            <h2>Server Information</h2>
            <dl class="detail-list">
              <dt>Server ID</dt>
              <dd><code>{{ srv.id }}</code></dd>
              <dt>Name</dt>
              <dd>{{ srv.name }}</dd>
              <dt>IPv4 Address</dt>
              <dd><code>{{ srv.ipv4 }}</code></dd>
              <dt>Status</dt>
              <dd><app-server-status-badge [status]="srv.status" /></dd>
              <dt>Created</dt>
              <dd>{{ formatDateTime(srv.createdAt) }}</dd>
              <dt>Last Updated</dt>
              <dd>{{ formatDateTime(srv.updatedAt) }}</dd>
            </dl>
          </article>

          <article class="panel section-card">
            <h2>Uptime</h2>
            <p class="muted" style="text-align:center; padding: var(--space-6);">
              Uptime data will be available once monitoring is active.
            </p>
          </article>
        </div>
      </ng-container>

      <dialog class="dialog-backdrop" *ngIf="showDeleteConfirm()" (click)="cancelDelete()">
        <div class="dialog" (click)="$event.stopPropagation()">
          <h2>Delete Server</h2>
          <p>Are you sure you want to delete <strong>{{ server()?.name }}</strong>? This action cannot be undone. Historical monitoring data will be preserved for reporting.</p>
          <div class="btn-row">
            <button class="btn btn-danger" [disabled]="isDeleting()" (click)="deleteServer()">
              {{ isDeleting() ? 'Deleting...' : 'Yes, Delete' }}
            </button>
            <button class="btn btn-secondary" (click)="cancelDelete()">Cancel</button>
          </div>
        </div>
      </dialog>
    </div>
  `,
})
export class ServerDetailPageComponent implements OnInit {
  readonly serverId: string;
  readonly server = signal<Server | null>(null);
  readonly isLoading = signal(true);
  readonly isDeleting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showDeleteConfirm = signal(false);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly serversApi: ServersApiService,
  ) {
    this.serverId = this.route.snapshot.paramMap.get('serverId')!;
  }

  ngOnInit(): void {
    this.loadServer();
  }

  private loadServer(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.serversApi.getServer(this.serverId).subscribe({
      next: (server) => {
        this.server.set(server);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(getErrorMessage(err));
        this.isLoading.set(false);
      },
    });
  }

  confirmDelete(): void {
    this.showDeleteConfirm.set(true);
  }

  cancelDelete(): void {
    this.showDeleteConfirm.set(false);
  }

  deleteServer(): void {
    this.isDeleting.set(true);
    this.serversApi.deleteServer(this.serverId).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.router.navigate(['/servers/inventory']);
      },
      error: (err) => {
        this.errorMessage.set(getErrorMessage(err));
        this.isDeleting.set(false);
        this.showDeleteConfirm.set(false);
      },
    });
  }

  formatDateTime = formatDateTime;
}
