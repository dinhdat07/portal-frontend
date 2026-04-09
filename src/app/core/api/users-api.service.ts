import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { ApiMessageResponse } from '../models/auth.models';
import { mapTransportUser, TransportUser } from '../models/user.models';
import { ApiClientService } from './api-client.service';

@Injectable({ providedIn: 'root' })
export class UsersApiService {
  constructor(private readonly api: ApiClientService) {}

  getMyProfile() {
    return this.api
      .get<TransportUser>('/users/me')
      .pipe(map((response) => mapTransportUser(response)));
  }

  updateMyProfile(payload: {
    username?: string;
    first_name?: string;
    last_name?: string;
    dob?: string;
  }) {
    return this.api
      .put<TransportUser>('/users/me', payload)
      .pipe(map((response) => mapTransportUser(response)));
  }

  changeMyPassword(payload: {
    current_password: string;
    new_password: string;
    confirm_new_password: string;
  }) {
    return this.api.put<ApiMessageResponse>('/users/me/change-password', payload);
  }
}
