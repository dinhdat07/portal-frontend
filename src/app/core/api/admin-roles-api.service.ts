import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Permission, Role, TransportRole } from '../models/user.models';
import { ApiClientService } from './api-client.service';
import { MessageResponse } from './api.types';

export function mapTransportRole(transport: TransportRole): Role {
  return {
    id: transport.id,
    code: transport.code,
    name: transport.name,
    isSystem: transport.is_system,
    permissions: transport.permissions || [],
  };
}

@Injectable({ providedIn: 'root' })
export class AdminRolesApiService {
  constructor(private readonly api: ApiClientService) {}

  getRoles(): Observable<Role[]> {
    return this.api
      .get<{ data: TransportRole[] }>('/admin/roles')
      .pipe(map((res) => res.data.map(mapTransportRole)));
  }

  createRole(payload: { code: string; name: string }): Observable<Role> {
    return this.api
      .post<TransportRole>('/admin/roles', payload)
      .pipe(map(mapTransportRole));
  }

  deleteRole(roleId: string, replacementRoleId?: string): Observable<MessageResponse> {
    return this.api.delete<MessageResponse>(`/admin/roles/${roleId}`, {
      query: replacementRoleId ? { replacement_role_id: replacementRoleId } : undefined,
    });
  }

  assignPermission(roleId: string, permissionId: string): Observable<MessageResponse> {
    return this.api.put<MessageResponse>(`/admin/roles/${roleId}/permissions/${permissionId}`);
  }

  removePermission(roleId: string, permissionId: string): Observable<MessageResponse> {
    return this.api.delete<MessageResponse>(`/admin/roles/${roleId}/permissions/${permissionId}`);
  }

  getPermissions(): Observable<Permission[]> {
    return this.api
      .get<{ data: Permission[] }>('/admin/permissions')
      .pipe(map((res) => res.data));
  }
}
