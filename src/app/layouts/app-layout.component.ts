import { Component, computed, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthStateService } from '../core/auth/auth-state.service';

interface NavigationItem {
  label: string;
  path: string;
  adminOnly?: boolean;
}

@Component({
  selector: 'app-app-layout',
  imports: [NgFor, NgIf, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="app-shell" *ngIf="user() as currentUser">
      <div class="app-grid">
        <aside class="panel sidebar">
          <div>
            <p class="eyebrow">Portal</p>
            <h1>User Console</h1>
            <p class="muted">
              Manage your account settings and team members from one place.
            </p>
          </div>

          <nav class="nav-list">
            <a
              *ngFor="let item of visibleNavigation()"
              [routerLink]="item.path"
              routerLinkActive="nav-link-active"
              class="nav-link"
            >
              {{ item.label }}
            </a>
          </nav>

          <section class="user-panel">
            <p class="strong">{{ currentUser.firstName }} {{ currentUser.lastName }}</p>
            <p>{{ currentUser.email }}</p>
            <div class="user-panel-foot">
              <span class="badge badge-accent">{{ currentUser.role }}</span>
              <button class="btn btn-secondary" [disabled]="isSigningOut()" (click)="signOut()">
                {{ isSigningOut() ? 'Signing out...' : 'Sign out' }}
              </button>
            </div>
          </section>
        </aside>

        <main class="panel app-main">
          <div class="workspace-head">
            <div>
              <p class="workspace-eyebrow">Operations</p>
              <h2>Portal Workspace</h2>
            </div>
            <div class="workspace-tip">
              Tips: use the side menu to quickly switch between profile, security, and admin tools.
            </div>
          </div>

          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
})
export class AppLayoutComponent {
  private readonly navigation: NavigationItem[] = [
    { label: 'Profile', path: '/account/profile' },
    { label: 'Security', path: '/account/security' },
    { label: 'Admin Users', path: '/admin/users', adminOnly: true },
  ];

  readonly user = computed(() => this.authState.currentUser());
  readonly isSigningOut = signal(false);

  readonly visibleNavigation = computed(() =>
    this.navigation.filter((item) => !item.adminOnly || this.user()?.role === 'admin'),
  );

  constructor(
    private readonly authState: AuthStateService,
    private readonly router: Router,
  ) {}

  signOut(): void {
    if (this.isSigningOut()) {
      return;
    }

    this.isSigningOut.set(true);
    this.authState.signOut().subscribe({
      next: () => {
        this.isSigningOut.set(false);
        this.router.navigateByUrl('/login');
      },
      error: () => {
        this.isSigningOut.set(false);
        this.router.navigateByUrl('/login');
      },
    });
  }
}
