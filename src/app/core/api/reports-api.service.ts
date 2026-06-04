import { Injectable } from '@angular/core';
import { ApiClientService } from './api-client.service';
import { ReportRequestPayload, ReportRequestResponse } from '../models/report.models';

@Injectable({ providedIn: 'root' })
export class ReportsApiService {
  constructor(private readonly api: ApiClientService) {}

  requestReport(payload: ReportRequestPayload) {
    return this.api.post<ReportRequestResponse>('/servers/report', payload);
  }
}
