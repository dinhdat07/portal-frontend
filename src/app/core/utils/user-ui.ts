import { UserRole, UserStatus } from '../models/user.models';

export function statusLabel(status: UserStatus): string {
  return status === 'pending_verification' ? 'pending' : status;
}

export function statusBadgeClass(status: UserStatus): string {
  if (status === 'active') {
    return 'badge badge-success';
  }

  if (status === 'pending_verification') {
    return 'badge badge-warning';
  }

  return 'badge badge-danger';
}

export function roleBadgeClass(role: UserRole): string {
  return role === 'admin' ? 'badge badge-accent' : 'badge badge-neutral';
}
