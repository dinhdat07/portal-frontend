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
        ],
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
