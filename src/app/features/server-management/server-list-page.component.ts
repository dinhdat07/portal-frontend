import { Component, computed, signal, OnInit } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ServersApiService, ServerFilters } from '../../core/api/servers-api.service';
import { getErrorMessage } from '../../core/api/api.types';
import { PaginationMeta, Server } from '../../core/models/server.models';
import { formatDateTime } from '../../core/utils/date-utils';
import { ServerStatusBadgeComponent } from './shared/server-status-badge.component';

interface ServerListFilterForm {
  filterName: string;
  filterStatus: string;
}

@Component({
  selector: 'app-server-list-page',
  imports: [ReactiveFormsModule, RouterLink, NgIf, NgFor, NgClass, ServerStatusBadgeComponent],
  template: `
    <div class="stack-lg">
      <section class="page-head">
        <div>
          <p class="eyebrow">Infrastructure</p>
          <h1>Server Inventory</h1>
          <p>Manage, monitor, and maintain your server infrastructure.</p>
        </div>
        <div class="btn-group">
          <a class="btn btn-secondary" routerLink="/servers/import">Import Excel</a>
          <a class="btn btn-primary" routerLink="/servers/new">Add Server</a>
        </div>
      </section>

      <article class="panel section-card">
        <form class="form-grid" [formGroup]="filtersForm" (ngSubmit)="applyFilters()">
          <div class="grid-cols-2">
            <label class="field"><span>Server name</span><input type="text" formControlName="filterName" placeholder="Search by name" /></label>
            <label class="field"><span>Status</span>
              <select formControlName="filterStatus">
                <option value="">All statuses</option>
                <option value="ONLINE">Online</option>
                <option value="OFFLINE">Offline</option>
              </select>
            </label>
          </div>
          <div class="btn-row">
            <button type="submit" class="btn btn-primary">Apply filters</button>
            <button type="button" class="btn btn-secondary" (click)="resetFilters()">Reset</button>
          </div>
        </form>
      </article>

      <div class="alert alert-danger" *ngIf="errorMessage()">
        {{ errorMessage() }}
      </div>

      <div class="alert alert-info" *ngIf="isLoading()">
        Loading servers...
      </div>

      <article class="panel section-card">
        <div class="table-wrap">
          <table class="data-table" *ngIf="servers().length > 0; else emptyState">
            <thead>
              <tr>
                <th>Server Name</th>
                <th>IPv4 Address</th>
                <th>Status</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let server of servers()">
                <td>
                  <a [routerLink]="['/servers', server.id]" class="strong">{{ server.name }}</a>
                </td>
                <td><code>{{ server.ipv4 }}</code></td>
                <td><app-server-status-badge [status]="server.status" /></td>
                <td>{{ formatDateTime(server.updatedAt) }}</td>
                <td>
                  <a [routerLink]="['/servers', server.id, 'edit']" class="btn btn-secondary btn-sm">Edit</a>
                </td>
              </tr>
            </tbody>
          </table>
          <ng-template #emptyState>
            <div class="empty-state">
              <p class="strong">No servers found</p>
              <p class="muted">Add your first server or adjust your filters.</p>
            </div>
          </ng-template>
        </div>

        <div class="pagination-row" *ngIf="pagination().total_pages > 1">
          <button class="btn btn-secondary" [disabled]="pagination().page <= 1" (click)="goToPage(pagination().page - 1)">Previous</button>
          <span class="muted">Page {{ pagination().page }} of {{ pagination().total_pages }} ({{ pagination().total_count }} servers)</span>
          <button class="btn btn-secondary" [disabled]="pagination().page >= pagination().total_pages" (click)="goToPage(pagination().page + 1)">Next</button>
        </div>
      </article>
    </div>
  `,
})
export class ServerListPageComponent implements OnInit {
  readonly servers = signal<Server[]>([]);
  readonly pagination = signal<PaginationMeta>({ page: 1, page_size: 20, total_count: 0, total_pages: 0 });
  readonly errorMessage = signal<string | null>(null);
  readonly isLoading = signal(false);

  readonly filtersForm = this.fb.group({
    filterName: [''],
    filterStatus: [''],
  });

  constructor(
    private readonly serversApi: ServersApiService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly fb: NonNullableFormBuilder,
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params: ParamMap) => {
      const page = Number(params.get('page')) || 1;
      const filterName = params.get('filter_name') || '';
      const filterStatus = params.get('filter_status') || '';

      this.filtersForm.setValue({ filterName, filterStatus }, { emitEvent: false });
      this.loadServers(page, filterName, filterStatus);
    });
  }

  applyFilters(): void {
    const { filterName, filterStatus } = this.filtersForm.getRawValue();
    this.router.navigate([], {
      queryParams: { page: 1, filter_name: filterName || undefined, filter_status: filterStatus || undefined },
      queryParamsHandling: 'merge',
    });
  }

  resetFilters(): void {
    this.filtersForm.reset({ filterName: '', filterStatus: '' });
    this.router.navigate([], { queryParams: { page: 1 }, queryParamsHandling: 'merge' });
  }

  goToPage(page: number): void {
    const { filterName, filterStatus } = this.filtersForm.getRawValue();
    this.router.navigate([], {
      queryParams: { page, filter_name: filterName || undefined, filter_status: filterStatus || undefined },
      queryParamsHandling: 'merge',
    });
  }

  private loadServers(page: number, filterName: string, filterStatus: string): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const filters: ServerFilters = {
      page,
      limit: 20,
      filterStatus: filterStatus || undefined,
      filterName: filterName || undefined,
    };

    this.serversApi.getServers(filters).subscribe({
      next: (result) => {
        this.servers.set(result.servers);
        this.pagination.set(result.meta);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(getErrorMessage(err));
        this.isLoading.set(false);
      },
    });
  }

  formatDateTime = formatDateTime;
}
