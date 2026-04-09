import { TransportUser, UserSummary } from './user.models';

export interface ApiMessageResponse {
  message: string;
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: TransportUser;
}

export interface RefreshResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresAt: string;
  user: UserSummary;
}
