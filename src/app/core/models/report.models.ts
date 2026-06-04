export interface ReportRequestPayload {
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  target_email: string;
}

export interface ReportRequestResponse {
  status: string;
  code: number;
  message: string;
}
