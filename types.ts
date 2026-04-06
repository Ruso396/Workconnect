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
  /** `users.id` for registered workers; required for project group membership. */
  user_id?: number | null;
  name: string;
  phone: string;
  role: WorkerTradeRole;
  location: string;
  status: WorkerStatus;
  profile_image?: string | null;
}

export type ProjectStatus = 'active' | 'pending' | 'closed';

export interface ProjectListItem {
  id: number;
  contractor_id: number;
  name: string;
  location: string;
  start_date: string;
  end_date: string | null;
  description: string | null;
  status: ProjectStatus;
  running_days?: number;
  created_at: string;
}

export interface ProjectWorkerMember {
  user_id: number;
  name: string;
  phone: string;
  role: string;
  status: WorkerStatus;
  profile_image?: string | null;
}

export interface Project extends ProjectListItem {
  workers: ProjectWorkerMember[];
}

export interface WorkerProjectListItem {
  id: number;
  name: string;
  location: string;
  start_date: string;
  description: string | null;
  status?: ProjectStatus;
  running_days?: number;
}

export type AttendanceStatus = 'present' | 'absent';

export interface AttendancePresentWorker {
  user_id: number;
  name: string;
  role: string;
  profile_image?: string | null;
}

export interface AttendanceAbsentWorker {
  user_id: number;
  name: string;
  role: string;
  profile_image?: string | null;
}

export interface AttendanceByDateResult {
  already_marked: boolean;
  present_workers: AttendancePresentWorker[];
  absent_workers: AttendanceAbsentWorker[];
}

/** Logged-in worker's aggregate status for a calendar day (any project). */
export interface WorkerAttendanceByDateResult {
  status: AttendanceStatus | null;
}

export interface ContractorRole {
  id: number;
  role_key: string;
  role_name: string;
}

export interface ContractorNotification {
  id: number;
  worker_name: string;
  worker_profile_image?: string | null;
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

/** Same shape as contractor clear-all; job_requests removed for this worker. */
export type DeleteAllWorkerNotificationsResult = DeleteAllContractorNotificationsResult;

export interface Job {
  id: number;
  contractor_id: number;
  project_id?: number | null;
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
  contractor_name: string;
  contractor_profile_image?: string | null;
  /** ISO-like timestamp from `job_requests.created_at` */
  created_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}
