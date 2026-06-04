import { Routes } from '@angular/router';
import { guestChildGuard, authChildGuard, adminGuard } from './core/auth/auth.guards';
import { PublicLayoutComponent } from './layouts/public-layout.component';
import { AppLayoutComponent } from './layouts/app-layout.component';
import { LoginPageComponent } from './features/auth/login-page.component';
import { RegisterPageComponent } from './features/auth/register-page.component';
import { RegisterSuccessPageComponent } from './features/auth/register-success-page.component';
import { VerifyEmailPageComponent } from './features/auth/verify-email-page.component';
import { ResendVerificationPageComponent } from './features/auth/resend-verification-page.component';
import { ForgotPasswordPageComponent } from './features/auth/forgot-password-page.component';
import { ResetPasswordPageComponent } from './features/auth/reset-password-page.component';
import { SetPasswordPageComponent } from './features/auth/set-password-page.component';
import { ProfilePageComponent } from './features/profile/profile-page.component';
import { ProfileEditPageComponent } from './features/profile/profile-edit-page.component';
import { SecurityPageComponent } from './features/profile/security-page.component';
import { AdminUsersPageComponent } from './features/admin-users/admin-users-page.component';
import { AdminUserDetailPageComponent } from './features/admin-users/admin-user-detail-page.component';
import { AdminUserEditPageComponent } from './features/admin-users/admin-user-edit-page.component';
import { AdminUserCreatePageComponent } from './features/admin-users/admin-user-create-page.component';
import { AdminRolesPageComponent } from './features/admin-roles/admin-roles-page.component';
import { AdminRoleCreatePageComponent } from './features/admin-roles/admin-role-create-page.component';
import { AdminRoleDetailPageComponent } from './features/admin-roles/admin-role-detail-page.component';

export const routes: Routes = [
  {
    path: '',
    component: PublicLayoutComponent,
    canActivateChild: [guestChildGuard],
    children: [
      { path: 'login', component: LoginPageComponent },
      { path: 'register', component: RegisterPageComponent },
      { path: 'register/verification-sent', component: RegisterSuccessPageComponent },
      { path: 'verify-email', component: VerifyEmailPageComponent },
      { path: 'resend-verification', component: ResendVerificationPageComponent },
      { path: 'forgot-password', component: ForgotPasswordPageComponent },
      { path: 'auth/reset-password', component: ResetPasswordPageComponent },
      { path: 'set-password', component: SetPasswordPageComponent },
    ],
  },
  {
    path: '',
    component: AppLayoutComponent,
    canActivateChild: [authChildGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'account/profile' },
      { path: 'account/profile', component: ProfilePageComponent },
      { path: 'account/profile/edit', component: ProfileEditPageComponent },
      { path: 'account/security', component: SecurityPageComponent },
      {
        path: 'admin',
        canActivate: [adminGuard],
        children: [
          { path: 'users', component: AdminUsersPageComponent },
          { path: 'users/new', component: AdminUserCreatePageComponent },
          { path: 'users/:userId/edit', component: AdminUserEditPageComponent },
          { path: 'users/:userId', component: AdminUserDetailPageComponent },
          { path: 'roles', component: AdminRolesPageComponent },
          { path: 'roles/new', component: AdminRoleCreatePageComponent },
          { path: 'roles/:roleId', component: AdminRoleDetailPageComponent },
        ],
      },
      {
        path: 'servers',
        canActivate: [adminGuard],
        children: [
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
          {
            path: 'dashboard',
            loadComponent: () => import('./features/server-management/server-dashboard-page.component').then(m => m.ServerDashboardPageComponent),
          },
          {
            path: 'inventory',
            loadComponent: () => import('./features/server-management/server-list-page.component').then(m => m.ServerListPageComponent),
          },
          {
            path: 'new',
            loadComponent: () => import('./features/server-management/server-create-page.component').then(m => m.ServerCreatePageComponent),
          },
          {
            path: 'import',
            loadComponent: () => import('./features/server-management/server-import-page.component').then(m => m.ServerImportPageComponent),
          },
          {
            path: 'reports',
            loadComponent: () => import('./features/server-management/server-report-page.component').then(m => m.ServerReportPageComponent),
          },
          {
            path: ':serverId/edit',
            loadComponent: () => import('./features/server-management/server-edit-page.component').then(m => m.ServerEditPageComponent),
          },
          {
            path: ':serverId',
            loadComponent: () => import('./features/server-management/server-detail-page.component').then(m => m.ServerDetailPageComponent),
          },
        ],
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
