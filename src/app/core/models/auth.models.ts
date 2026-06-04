import { TransportUser, UserSummary } from './user.models';

export interface ApiMessageResponse {
  message: string;
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface LoginResponse {
  // access_token and refresh_token removed — now in HttpOnly cookies
  token_type: string;
  expires_in: number;
  user: TransportUser;
}

export interface RefreshResponse {
  token_type: string;
  expires_in: number;
}

export interface AuthSession {
  // accessToken and refreshToken removed — handled by HttpOnly cookies
  tokenType: string;
  expiresAt: string;
  user: UserSummary;
}
