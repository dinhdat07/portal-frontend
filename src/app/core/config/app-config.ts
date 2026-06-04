import { environment } from '../../../environments/environment';

export const appConfig = {
  apiBaseUrl: environment.apiBaseUrl,
  featureFlags: {
    enableAdminCreateUser: true,
    enableProfileEdit: true,
    enableAdminUserEdit: true,
    enableServerManagement: true,
  },
} as const;
