import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { ApiClientService } from './api-client.service';
import {
  TransportServer,
  TransportPaginatedServers,
  PaginatedServers,
  Server,
  CreateServerPayload,
  UpdateServerPayload,
  ImportResult,
  mapTransportServer,
} from '../models/server.models';

export interface ServerFilters {
  page: number;
  limit: number;
  filterStatus?: string;
  filterName?: string;
}

@Injectable({ providedIn: 'root' })
export class ServersApiService {
  constructor(private readonly api: ApiClientService) {}

  getServers(filters: ServerFilters) {
    return this.api
      .get<TransportPaginatedServers>('/servers', {
        query: {
          page: filters.page,
          limit: filters.limit,
          filter_status: filters.filterStatus || undefined,
          filter_name: filters.filterName || undefined,
        },
      })
      .pipe(
        map((response): PaginatedServers => ({
          servers: (response.servers || []).map(mapTransportServer),
          meta: {
            page: filters.page,
            page_size: filters.limit,
            total_count: response.total_count,
            total_pages: Math.ceil(response.total_count / filters.limit),
          },
        })),
      );
  }

  getServer(serverId: string) {
    return this.api
      .get<TransportServer>(`/servers/${serverId}`)
      .pipe(map((response) => mapTransportServer(response)));
  }

  createServer(payload: CreateServerPayload) {
    return this.api
      .post<{ server: TransportServer }>('/servers', payload)
      .pipe(map((response) => mapTransportServer(response.server)));
  }

  updateServer(serverId: string, payload: UpdateServerPayload) {
    return this.api
      .put<{ server: TransportServer }>(`/servers/${serverId}`, payload)
      .pipe(map((response) => mapTransportServer(response.server)));
  }

  deleteServer(serverId: string) {
    return this.api.delete<{ success: boolean }>(`/servers/${serverId}`);
  }

  importServers(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.post<ImportResult>('/servers/import', formData);
  }
}
