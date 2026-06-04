import { Component, signal, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ServersApiService } from '../../core/api/servers-api.service';
import { getErrorMessage } from '../../core/api/api.types';
import { Server } from '../../core/models/server.models';
import { ServerStatusBadgeComponent } from './shared/server-status-badge.component';
import { formatDateTime } from '../../core/utils/date-utils';

@Component({
  selector: 'app-server-dashboard-page',
  imports: [RouterLink, NgIf, NgFor, ServerStatusBadgeComponent],
  template: `
    <div class="stack-lg">
      <section class="page-head">
        <div>
          <p class="eyebrow">Infrastructure</p>
          <h1>Server Dashboard</h1>
          <p>Overview of your managed server infrastructure.</p>
        </div>
      </section>

      <div class="alert alert-danger" *ngIf="errorMessage()">{{ errorMessage() }}</div>

      <div class="grid-4col">
        <article class="panel stat-card">
          <p class="stat-number">{{ totalServers() }}</p>
          <p class="stat-label">Total Servers</p>
        </article>
        <article class="panel stat-card stat-success">
          <p class="stat-number">{{ onlineCount() }}</p>
          <p class="stat-label">Online</p>
        </article>
        <article class="panel stat-card stat-danger">
          <p class="stat-number">{{ offlineCount() }}</p>
          <p class="stat-label">Offline</p>
        </article>
        <article class="panel stat-card stat-info">
          <p class="stat-number">—</p>
          <p class="stat-label">Avg Uptime (24h)</p>
        </article>
      </div>

      <article class="panel section-card">
        <h2>Recent Servers</h2>
        <div class="table-wrap" *ngIf="recentServers().length > 0; else emptyRecent">
          <table class="data-table">
            <thead>
              <tr>
                <th>Server</th>
                <th>IPv4</th>
                <th>Status</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let s of recentServers()">
                <td><a [routerLink]="['/servers', s.id]" class="strong">{{ s.name }}</a></td>
                <td><code>{{ s.ipv4 }}</code></td>
                <td><app-server-status-badge [status]="s.status" /></td>
                <td>{{ formatDateTime(s.updatedAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <ng-template #emptyRecent>
          <p class="muted">No servers registered yet. <a routerLink="/servers/new">Add your first server</a>.</p>
        </ng-template>
      </article>
    </div>
  `,
})
export class ServerDashboardPageComponent implements OnInit {
  readonly servers = signal<Server[]>([]);
  readonly errorMessage = signal<string | null>(null);

  readonly totalServers = signal(0);
  readonly onlineCount = signal(0);
  readonly offlineCount = signal(0);
  readonly recentServers = signal<Server[]>([]);

  constructor(private readonly serversApi: ServersApiService) {}

  ngOnInit(): void {
    this.serversApi.getServers({ page: 1, limit: 10 }).subscribe({
      next: (result) => {
        const all = result.servers;
        this.servers.set(all);
        this.totalServers.set(result.meta.total_count);
        this.onlineCount.set(all.filter((s) => s.status === 'ONLINE').length);
        this.offlineCount.set(all.filter((s) => s.status === 'OFFLINE').length);
        this.recentServers.set(all.slice(0, 10));
      },
      error: (err) => {
        this.errorMessage.set(getErrorMessage(err));
      },
    });
  }

  formatDateTime = formatDateTime;
}
