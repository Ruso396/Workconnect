export type UserRole = 'worker' | 'contractor';
// Trade roles are contractor-managed (dynamic), so keep this as a string.
export type WorkerTradeRole = string;
export type WorkerStatus = 'active' | 'inactive';
export type JobRequestStatus = 'pending' | 'accepted' | 'rejected';

export interface User {
  id: number;
  name: string;
  phone: string;
  role: UserRole;
  status: WorkerStatus;
  profile_image?: string | null;
  location?: string | null;
}

export interface Worker {
  id: number;
  contractor_id: number;
  name: string;
  phone: string;
  role: WorkerTradeRole;
  location: string;
  status: WorkerStatus;
  profile_image?: string | null;
}

export interface ContractorRole {
  id: number;
  role_key: string;
  role_name: string;
}

export interface ContractorNotification {
  id: number;
  worker_name: string;
  action: string;
  job_title: string;
  job_location: string | null;
  request_id: number;
  is_read: number;
  created_at: string;
}

export interface DeleteAllContractorNotificationsResult {
  deleted_count: number;
}

export interface Job {
  id: number;
  contractor_id: number;
  title: string;
  location: string;
  salary: string;
  description: string;
}

export interface JobRequest {
  request_id: number;
  status: JobRequestStatus;
  job_id: number;
  title: string;
  location: string;
  salary: string;
  description: string;
  /** ISO-like timestamp from `job_requests.created_at` */
  created_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}
