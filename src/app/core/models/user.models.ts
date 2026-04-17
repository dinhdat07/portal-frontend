export type UserRole = 'user' | 'admin';
export type UserStatus = 'active' | 'pending_verification' | 'deleted';

export type TransportUserRole = 'ROLE_CODE_USER' | 'ROLE_CODE_ADMIN' | 'ROLE_CODE_UNSPECIFIED';
export type TransportUserStatus = 'USER_STATUS_ACTIVE' | 'USER_STATUS_PENDING_VERIFICATION' | 'USER_STATUS_DELETED' | 'USER_STATUS_UNSPECIFIED';

export interface TransportUser {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: TransportUserRole;
  status: TransportUserStatus;
  created_at: string;
  updated_at: string;
  dob?: string | null;
  email_verified_at?: string | null;
  last_login_at?: string | null;
  deleted_at?: string | null;
  deleted_by?: string | null;
  restored_at?: string | null;
  restored_by?: string | null;
}

export interface UserSummary {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  dob: string | null;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  deletedAt: string | null;
  deletedBy: string | null;
  restoredAt: string | null;
  restoredBy: string | null;
}

export interface PaginationMeta {
  page: number;
  page_size: number;
  total: number;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
}

export interface PaginatedTransportUsers {
  data: TransportUser[];
  meta: PaginationMeta;
}

export interface PaginatedUsers {
  data: UserSummary[];
  meta: Pagination;
}

export function mapTransportUser(transport: TransportUser): UserSummary {
  return {
    id: transport.id,
    email: transport.email,
    username: transport.username,
    firstName: transport.first_name,
    lastName: transport.last_name,
    role: mapTransportUserRole(transport.role),
    status: mapTransportUserStatus(transport.status),
    createdAt: transport.created_at,
    updatedAt: transport.updated_at,
    dob: transport.dob ?? null,
    emailVerifiedAt: transport.email_verified_at ?? null,
    lastLoginAt: transport.last_login_at ?? null,
    deletedAt: transport.deleted_at ?? null,
    deletedBy: transport.deleted_by ?? null,
    restoredAt: transport.restored_at ?? null,
    restoredBy: transport.restored_by ?? null,
  };
}

export function mapPagination(meta: PaginationMeta): Pagination {
  return {
    page: meta.page,
    pageSize: meta.page_size,
    total: meta.total,
  };
}

export function mapTransportUserRole(role: TransportUserRole): UserRole {
  if (role === 'ROLE_CODE_ADMIN') return 'admin';
  return 'user';
}

export function mapUserRoleToTransport(role: UserRole): TransportUserRole {
  if (role === 'admin') return 'ROLE_CODE_ADMIN';
  return 'ROLE_CODE_USER';
}

export function mapTransportUserStatus(status: TransportUserStatus): UserStatus {
  if (status === 'USER_STATUS_PENDING_VERIFICATION') return 'pending_verification';
  if (status === 'USER_STATUS_DELETED') return 'deleted';
  return 'active';
}

export function mapUserStatusToTransport(status: UserStatus): TransportUserStatus {
  if (status === 'pending_verification') return 'USER_STATUS_PENDING_VERIFICATION';
  if (status === 'deleted') return 'USER_STATUS_DELETED';
  return 'USER_STATUS_ACTIVE';
}
