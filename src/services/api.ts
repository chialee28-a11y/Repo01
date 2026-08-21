import {
  User,
  Department,
  LeaveRequest,
  BriefingSession,
  AttendanceRecord,
  AttendanceSummary,
  Notification,
  NotificationTemplate,
  EmailLog,
  AuditLog,
} from '../types';

const API_BASE = '/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'An unexpected error occurred' }));
    throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Auth
  login: (email: string, googleId?: string) =>
    request<{ user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, googleId }),
    }),

  // Users
  getUsers: () => request<User[]>('/users'),
  getUserById: (id: string) => request<User>(`/users/${id}`),
  registerUser: (userData: Partial<User>) =>
    request<User>('/users/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
  updateUser: (id: string, updates: Partial<User>, performer?: { id: string; name: string; email: string }) =>
    request<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ updates, performer }),
    }),
  deleteUser: (id: string) =>
    request<{ success: boolean }>(`/users/${id}`, {
      method: 'DELETE',
    }),

  // Departments
  getDepartments: () => request<Department[]>('/departments'),
  createDepartment: (dept: Partial<Department>) =>
    request<Department>('/departments', {
      method: 'POST',
      body: JSON.stringify(dept),
    }),
  updateDepartment: (id: string, updates: Partial<Department>) =>
    request<Department>(`/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  deleteDepartment: (id: string) =>
    request<{ success: boolean }>(`/departments/${id}`, {
      method: 'DELETE',
    }),

  // Leave Requests
  getLeaveRequests: (filters?: { userId?: string; departmentId?: string }) => {
    const query = new URLSearchParams();
    if (filters?.userId) query.append('userId', filters.userId);
    if (filters?.departmentId) query.append('departmentId', filters.departmentId);
    return request<LeaveRequest[]>(`/leave-requests?${query.toString()}`);
  },
  createLeaveRequest: (leaveData: Partial<LeaveRequest>) =>
    request<LeaveRequest>('/leave-requests', {
      method: 'POST',
      body: JSON.stringify(leaveData),
    }),
  updateLeaveRequest: (id: string, updates: Partial<LeaveRequest>, reviewer?: { id: string; name: string; email: string }) =>
    request<LeaveRequest>(`/leave-requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ updates, reviewer }),
    }),

  // Briefing Sessions
  getBriefingSessions: (departmentId?: string) => {
    const query = departmentId ? `?departmentId=${departmentId}` : '';
    return request<BriefingSession[]>(`/briefing-sessions${query}`);
  },
  createBriefingSession: (sessionData: Partial<BriefingSession>) =>
    request<BriefingSession>('/briefing-sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    }),
  updateBriefingSession: (id: string, updates: Partial<BriefingSession>) =>
    request<BriefingSession>(`/briefing-sessions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  suggestNextBriefingDate: (departmentId: string) =>
    request<{ suggestedDate: string; onLeaveCount: number; availableUsers: number; totalUsers: number }>(
      `/briefing-sessions/suggest-date/${departmentId}`
    ),

  // Attendance
  getAttendanceRecords: (briefingSessionId: string) =>
    request<{ records: AttendanceRecord[]; autoSuggestions: Record<string, boolean> }>(
      `/briefing-sessions/${briefingSessionId}/attendance`
    ),
  submitAttendance: (
    briefingSessionId: string,
    records: { userId: string; userName: string; userEmail: string; status: string; remarks?: string }[],
    markedByUserId: string,
    markedByName: string
  ) =>
    request<{ records: AttendanceRecord[]; summary: AttendanceSummary }>(
      `/briefing-sessions/${briefingSessionId}/attendance`,
      {
        method: 'POST',
        body: JSON.stringify({ records, markedByUserId, markedByName }),
      }
    ),
  getAttendanceSummary: (briefingSessionId: string) =>
    request<AttendanceSummary>(`/briefing-sessions/${briefingSessionId}/summary`),

  // Notifications & Emails
  getNotifications: (userId?: string) => {
    const query = userId ? `?userId=${userId}` : '';
    return request<Notification[]>(`/notifications${query}`);
  },
  markNotificationRead: (notificationId: string) =>
    request<{ success: boolean }>('/notifications/mark-read', {
      method: 'POST',
      body: JSON.stringify({ notificationId }),
    }),
  markAllNotificationsRead: (userId: string) =>
    request<{ success: boolean }>('/notifications/mark-all-read', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
  getNotificationTemplates: () => request<NotificationTemplate[]>('/notification-templates'),
  updateNotificationTemplate: (id: string, updates: Partial<NotificationTemplate>) =>
    request<NotificationTemplate>(`/notification-templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  getEmailLogs: () => request<EmailLog[]>('/email-logs'),

  // Audit Logs
  getAuditLogs: () => request<AuditLog[]>('/audit-logs'),
};
