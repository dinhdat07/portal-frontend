import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import {
  mapPagination,
  mapTransportUser,
  PaginatedTransportUsers,
  PaginatedUsers,
  TransportUser,
  UserStatus,
  mapUserStatusToTransport,
} from '../models/user.models';
import { ApiClientService } from './api-client.service';

export interface UserFilters {
  page: number;
  pageSize: number;
  username?: string;
  email?: string;
  fullName?: string;
  dob?: string;
  roleCode?: string;
  status?: UserStatus | '';
  includeDeleted?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminUsersApiService {
  constructor(private readonly api: ApiClientService) {}

  getAdminUsers(filters: UserFilters) {
    const statusQuery = filters.status ? mapUserStatusToTransport(filters.status) : undefined;

    return this.api
      .get<PaginatedTransportUsers>('/admin/users', {
        query: {
          page: filters.page,
          page_size: filters.pageSize,
          username: filters.username,
          email: filters.email,
          full_name: filters.fullName,
          dob: filters.dob,
          role_code: filters.roleCode,
          status: statusQuery,
          include_deleted: filters.includeDeleted ? true : undefined,
        },
      })
      .pipe(
        map((response): PaginatedUsers => ({
          data: response.data.map(mapTransportUser),
          meta: mapPagination(response.meta),
        })),
      );
  }

  getAdminUser(userId: string) {
    return this.api
      .get<TransportUser>(`/admin/users/${userId}`)
      .pipe(map((response) => mapTransportUser(response)));
  }

  createAdminUser(payload: {
    email: string;
    username: string;
    first_name: string;
    last_name: string;
    dob: string;
    role_code: string;
  }) {
    return this.api
      .post<TransportUser>('/admin/users', payload)
      .pipe(map((response) => mapTransportUser(response)));
  }

  updateAdminUser(
    userId: string,
    payload: {
      username: string;
      first_name: string;
      last_name: string;
      dob: string;
    },
  ) {
    return this.api
      .put<TransportUser>(`/admin/users/${userId}`, payload)
      .pipe(map((response) => mapTransportUser(response)));
  }

  updateAdminUserRole(userId: string, roleCode: string) {
    return this.api
      .put<TransportUser>(`/admin/users/${userId}/role`, { role_code: roleCode })
      .pipe(map((response) => mapTransportUser(response)));
  }

  deleteAdminUser(userId: string) {
    return this.api
      .delete<TransportUser>(`/admin/users/${userId}/delete`)
      .pipe(map((response) => mapTransportUser(response)));
  }

  restoreAdminUser(userId: string) {
    return this.api
      .put<TransportUser>(`/admin/users/${userId}/restore`)
      .pipe(map((response) => mapTransportUser(response)));
  }
}
