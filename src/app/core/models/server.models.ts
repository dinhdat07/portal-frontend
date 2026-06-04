export type ServerStatus = 'ONLINE' | 'OFFLINE' | 'UNKNOWN';

export interface TransportServer {
  server_id: string;
  server_name: string;
  ipv4: string;
  current_status: string;
  created_at: string;
  updated_at: string;
}

export interface Server {
  id: string;
  name: string;
  ipv4: string;
  status: ServerStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
}

export interface PaginatedServers {
  servers: Server[];
  meta: PaginationMeta;
}

export interface TransportPaginatedServers {
  servers: TransportServer[];
  total_count: number;
}

export interface CreateServerPayload {
  server_name: string;
  ipv4: string;
}

export interface UpdateServerPayload {
  server_name: string;
  ipv4: string;
}

export interface ImportResult {
  total_rows: number;
  success_count: number;
  failure_count: number;
  failures: ImportFailure[];
}

export interface ImportFailure {
  row: number;
  server_name: string;
  ipv4: string;
  reason: string;
}

export function mapTransportServer(t: TransportServer): Server {
  return {
    id: t.server_id,
    name: t.server_name,
    ipv4: t.ipv4,
    status: mapTransportStatus(t.current_status),
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  };
}

function mapTransportStatus(s: string): ServerStatus {
  switch (s) {
    case 'ONLINE': return 'ONLINE';
    case 'OFFLINE': return 'OFFLINE';
    default: return 'UNKNOWN';
  }
}
