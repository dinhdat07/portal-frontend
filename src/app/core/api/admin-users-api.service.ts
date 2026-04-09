import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import {
  mapPagination,
  mapTransportUser,
  PaginatedTransportUsers,
  PaginatedUsers,
  TransportUser,
  UserRole,
  UserStatus,
} from '../models/user.models';
import { ApiClientService } from './api-client.service';

export interface UserFilters {
  page: number;
  pageSize: number;
  username?: string;
  email?: string;
  fullName?: string;
  dob?: string;
  role?: UserRole | '';
  status?: UserStatus | '';
  includeDeleted?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminUsersApiService {
  constructor(private readonly api: ApiClientService) {}

  getAdminUsers(filters: UserFilters) {
    return this.api
      .get<PaginatedTransportUsers>('/admin/users', {
        query: {
          page: filters.page,
          page_size: filters.pageSize,
          username: filters.username,
          email: filters.email,
          full_name: filters.fullName,
          dob: filters.dob,
          role: filters.role,
          status: filters.status,
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
    role: UserRole;
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

  updateAdminUserRole(userId: string, role: UserRole) {
    return this.api
      .put<TransportUser>(`/admin/users/${userId}/role`, { role })
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
