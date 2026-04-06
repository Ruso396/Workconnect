import {
    ApiResponse,
    AttendanceByDateResult,
    WorkerAttendanceByDateResult,
    ContractorNotification,
    ContractorRole,
    DeleteAllContractorNotificationsResult,
    DeleteAllWorkerNotificationsResult,
    JobRequest,
    Project,
    ProjectListItem,
    User,
    UserRole,
    Worker,
    WorkerProjectListItem,
    WorkerStatus,
    WorkerTradeRole,
} from '../types';

/** Must stay in sync with `workconnect-api/config.php` `$WORKCONNECT_API_BASE_URL`. */
export const API_BASE_URL = 'http://192.168.1.3/workconnect-api/';

const BASE_URL = API_BASE_URL;

/**
 * Build a display URI for React Native Image: resolve relative paths against API_BASE_URL
 * and append a stable cache-bust query from the upload filename timestamp when present.
 */
export function profileImageUri(raw: string | null | undefined): string | undefined {
  if (raw == null || String(raw).trim() === '') {
    return undefined;
  }
  let u = String(raw).trim();
  if (!/^https?:\/\//i.test(u)) {
    const base = BASE_URL.replace(/\/+$/, '');
    const path = u.replace(/^\/+/, '');
    u = `${base}/${path}`;
  }
  const m = u.match(/profile_\d+_(\d+)\./i);
  const v = m ? m[1] : `${Date.now()}`;
  const sep = u.includes('?') ? '&' : '?';
  return `${u}${sep}v=${v}`;
}

const toFormBody = (payload: Record<string, string | number>) =>
  Object.entries(payload)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');

async function request<T>(
  endpoint: string,
  method: 'GET' | 'POST',
  payload?: Record<string, string | number>,
): Promise<T> {
  const cleanEndpoint = endpoint.replace(/^\/+/, '');
  const url =
    method === 'GET' && payload
      ? `${BASE_URL}${cleanEndpoint}?${toFormBody(payload)}`
      : `${BASE_URL}${cleanEndpoint}`;

  console.log('[API] Request start:', { method, url, payload });

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers:
        method === 'POST'
          ? {
              'Content-Type': 'application/json',
            }
          : undefined,
      body: method === 'POST' && payload ? JSON.stringify(payload) : undefined,
    });
  } catch (error) {
    console.log('API ERROR:', error);
    throw error;
  }

  console.log('[API] Response received:', { method, url, status: response.status });

  const json = (await response.json()) as ApiResponse<T>;
  console.log('[API] Parsed JSON:', json);
  if (!response.ok || !json.success) {
    throw new Error(json.message ?? 'Request failed');
  }

  if (typeof json.data === 'undefined') {
    throw new Error('Invalid server response');
  }

  return json.data;
}

async function postJson<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  const cleanEndpoint = endpoint.replace(/^\/+/, '');
  const url = `${BASE_URL}${cleanEndpoint}`;

  console.log('[API] postJson start:', { url, body });

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (error) {
    console.log('API ERROR:', error);
    throw error;
  }

  const json = (await response.json()) as ApiResponse<T>;
  if (!response.ok || !json.success) {
    throw new Error(json.message ?? 'Request failed');
  }
  if (typeof json.data === 'undefined') {
    throw new Error('Invalid server response');
  }
  return json.data;
}

export const api = {
  login: (phone: string, password: string, role: UserRole) =>
    request<User>('login.php', 'POST', { phone, password, role }),

  addWorker: (
    contractorId: number,
    name: string,
    phone: string,
    password: string,
    role: WorkerTradeRole,
    location: string,
  ) =>
    request<Worker>('add_worker.php', 'POST', {
      contractor_id: contractorId,
      name,
      phone,
      password,
      role,
      location,
    }),

  getWorkers: (contractorId: number) =>
    request<Worker[]>('get_workers.php', 'GET', { contractor_id: contractorId }),

  sendJob: (
    contractorId: number,
    projectId: number,
    target_role: string,
    location: string,
    salary: string,
    description: string,
  ) =>
    request<{ job_id: number; assigned_count: number }>('send_job.php', 'POST', {
      contractor_id: contractorId,
      project_id: projectId,
      target_role,
      location,
      salary,
      description,
    }),

  createProject: (
    contractorId: number,
    payload: {
      name: string;
      location: string;
      start_date: string;
      end_date?: string | null;
      description?: string | null;
    },
  ) =>
    request<ProjectListItem>('projects_create.php', 'POST', {
      contractor_id: contractorId,
      name: payload.name,
      location: payload.location,
      start_date: payload.start_date,
      ...(payload.end_date ? { end_date: payload.end_date } : {}),
      ...(payload.description ? { description: payload.description } : {}),
    }),

  getProjects: (contractorId: number, status?: 'active' | 'closed') =>
    request<ProjectListItem[]>('projects_list.php', 'GET', {
      contractor_id: contractorId,
      ...(status ? { status } : {}),
    }),

  getProject: (contractorId: number, projectId: number) =>
    request<Project>('projects_get.php', 'GET', {
      contractor_id: contractorId,
      project_id: projectId,
    }),

  updateProject: (
    contractorId: number,
    projectId: number,
    payload: {
      name: string;
      location: string;
      start_date: string;
      end_date?: string | null;
      description?: string | null;
    },
  ) =>
    postJson<{ id: number }>('projects_update.php', {
      contractor_id: contractorId,
      project_id: projectId,
      name: payload.name,
      location: payload.location,
      start_date: payload.start_date,
      end_date: payload.end_date ?? null,
      description: payload.description ?? null,
    }),

  deleteProject: (contractorId: number, projectId: number) =>
    request<{ deleted: boolean }>('projects_delete.php', 'POST', {
      contractor_id: contractorId,
      project_id: projectId,
    }),

  closeProject: (contractorId: number, projectId: number) =>
    request<{ id: number; status: string }>('projects_close.php', 'POST', {
      contractor_id: contractorId,
      project_id: projectId,
    }),

  pauseProject: (contractorId: number, projectId: number) =>
    request<{ id: number; status: string }>('projects_pause.php', 'POST', {
      contractor_id: contractorId,
      project_id: projectId,
    }),

  resumeProject: (contractorId: number, projectId: number) =>
    request<{ id: number; status: string }>('projects_resume.php', 'POST', {
      contractor_id: contractorId,
      project_id: projectId,
    }),

  addProjectWorkers: (contractorId: number, projectId: number, workerIds: number[]) =>
    postJson<{ added_count: number; worker_ids: number[] }>('projects_add_workers.php', {
      contractor_id: contractorId,
      project_id: projectId,
      worker_ids: workerIds,
    }),

  markAttendance: (
    contractorId: number,
    projectId: number,
    date: string,
    presentWorkerIds: number[],
  ) =>
    postJson<{ updated: number; present_count: number; absent_count: number }>(
      'attendance_mark.php',
      {
        contractor_id: contractorId,
        project_id: projectId,
        date,
        present_worker_ids: presentWorkerIds,
      },
    ),

  getAttendanceByDate: (contractorId: number, projectId: number, date: string) =>
    request<AttendanceByDateResult>('attendance_by_date.php', 'GET', {
      contractor_id: contractorId,
      project_id: projectId,
      date,
    }),

  getWorkerAttendanceByDate: (workerId: number, date: string) =>
    request<WorkerAttendanceByDateResult>('worker_attendance_by_date.php', 'GET', {
      worker_id: workerId,
      date,
    }),

  getContractorRoles: (contractorId: number) => request<ContractorRole[]>('get_roles.php', 'GET', { contractor_id: contractorId }),
  addContractorRole: (contractorId: number, role_name: string) =>
    request<ContractorRole>('add_role.php', 'POST', { contractor_id: contractorId, role_name }),
  updateContractorRole: (roleId: number, role_name: string) =>
    request<ContractorRole>('update_role.php', 'POST', { role_id: roleId, role_name }),
  deleteContractorRole: (roleId: number) =>
    request<{ deleted: boolean }>('delete_role.php', 'POST', { role_id: roleId }),

  getContractorUnreadCount: (contractorId: number) =>
    request<{ count: number }>('get_contractor_unread_count.php', 'GET', { contractor_id: contractorId }),
  getContractorNotifications: (contractorId: number) =>
    request<ContractorNotification[]>('get_contractor_notifications.php', 'GET', { contractor_id: contractorId }),
  markContractorNotificationsRead: (contractorId: number) =>
    request<{ updated: number }>('mark_contractor_notifications_read.php', 'POST', { contractor_id: contractorId }),
  deleteAllContractorNotifications: (contractorId: number) =>
    request<DeleteAllContractorNotificationsResult>('delete_all_contractor_notifications.php', 'POST', {
      contractor_id: contractorId,
    }),

  updateStatus: (workerId: number, status: WorkerStatus) =>
    request<{ worker_id: number; status: WorkerStatus }>('update_status.php', 'POST', {
      worker_id: workerId,
      status,
    }),

  getJobs: (workerId: number) => request<JobRequest[]>('get_jobs.php', 'GET', { worker_id: workerId }),

  deleteAllWorkerNotifications: (workerId: number) =>
    request<DeleteAllWorkerNotificationsResult>('delete_all_worker_notifications.php', 'POST', {
      worker_id: workerId,
    }),

  getWorkerProjects: (workerId: number) =>
    request<WorkerProjectListItem[]>('worker_projects.php', 'GET', { worker_id: workerId }),

  getWorkerProject: (workerId: number, projectId: number) =>
    request<WorkerProjectListItem>('worker_project_get.php', 'GET', {
      worker_id: workerId,
      project_id: projectId,
    }),

  updateJobRequestStatus: (requestId: number, status: 'accepted' | 'rejected') =>
    request<{ request_id: number; status: string }>('update_job_request.php', 'POST', {
      request_id: requestId,
      status,
    }),

  getProfile: (userId: number) => request<User>('get_profile.php', 'POST', { user_id: userId }),

  updateProfile: (
    userId: number,
    payload: { name?: string; phone?: string; password?: string; location?: string },
  ) =>
    request<User>('update_profile.php', 'POST', {
      user_id: userId,
      ...(payload.name ? { name: payload.name } : {}),
      ...(payload.phone ? { phone: payload.phone } : {}),
      ...(payload.password ? { password: payload.password } : {}),
      ...(payload.location ? { location: payload.location } : {}),
    }),

  uploadProfileImage: async (userId: number, image: { uri: string; name: string; type: string }) => {
    const cleanEndpoint = 'upload_profile.php';
    const url = `${BASE_URL}${cleanEndpoint}`;

    const formData = new FormData();
    formData.append('user_id', String(userId));
    // @ts-expect-error React Native FormData file type
    formData.append('image', image);

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    const json = (await response.json()) as ApiResponse<User>;
    if (!response.ok || !json.success) {
      throw new Error(json.message ?? 'Image upload failed');
    }
    if (!json.data) {
      throw new Error('Invalid server response');
    }
    return json.data;
  },
};
