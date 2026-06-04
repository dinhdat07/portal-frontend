import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';
import { ServerStatus } from '../../../core/models/server.models';

@Component({
  selector: 'app-server-status-badge',
  imports: [NgClass],
  template: `
    <span class="badge" [ngClass]="badgeClass()">{{ label() }}</span>
  `,
})
export class ServerStatusBadgeComponent {
  @Input({ required: true }) status!: ServerStatus;

  label(): string {
    switch (this.status) {
      case 'ONLINE': return 'Online';
      case 'OFFLINE': return 'Offline';
      default: return 'Unknown';
    }
  }

  badgeClass(): string {
    switch (this.status) {
      case 'ONLINE': return 'badge-success';
      case 'OFFLINE': return 'badge-error';
      default: return 'badge-neutral';
    }
  }
}
