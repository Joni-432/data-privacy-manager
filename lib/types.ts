export type RequestType = 'EXPORT' | 'DELETE';

export type RequestStatus = 
  | 'SUBMITTED' 
  | 'VALIDATED' 
  | 'QUEUED' 
  | 'PROCESSING' 
  | 'COMPLETED' 
  | 'FAILED';

export interface PrivacyRequest {
  id: string;
  user_id: string | null;
  request_type: RequestType;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  request_id: string;
  job_type: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  created_at: string;
  completed_at: string | null;
}

export interface Evidence {
  id: string;
  request_id: string;
  file_url: string;
  description: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  request_id: string;
  action: string;
  performed_by: string;
  created_at: string;
}

// The message format we will send to QStash
export interface JobPayload {
  requestId: string;
  type: RequestType;
}