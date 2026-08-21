/**
 * LeavePlan & Attendance Hub - Domain Types
 */

export type UserRole = 'Normal User' | 'Super User' | 'Admin';
export type UserStatus = 'Active' | 'Inactive';

export interface User {
  id: string;
  name: string;
  email: string;
  googleId: string;
  departmentId: string;
  departmentName: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  lastLoginAt: string;
  avatarUrl?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  headUserEmail?: string;
  createdAt: string;
}

export type LeaveType = 'Annual Leave' | 'Medical Leave' | 'Childcare Leave' | 'Off-in-lieu' | 'Others';
export type LeaveStatus = 'Draft' | 'Submitted' | 'Approved' | 'Rejected' | 'Cancelled';
export type LeaveDayType = 'Full Day' | 'Half Day (AM)' | 'Half Day (PM)';

export interface LeaveRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  departmentId: string;
  departmentName: string;
  leaveType: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  dayOption: LeaveDayType;
  totalDays: number;
  reason: string;
  attachmentUrl?: string;
  attachmentName?: string;
  status: LeaveStatus;
  createdAt: string;
  updatedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewRemarks?: string;
}

export type BriefingStatus = 'Planned' | 'Completed' | 'Cancelled';

export interface BriefingSession {
  id: string;
  title: string;
  departmentId: string;
  departmentName: string;
  dateTime: string; // ISO format: 2026-08-05T09:30:00
  location: string;
  isOnline: boolean;
  meetingLink?: string;
  createdByUserId: string;
  createdByName: string;
  status: BriefingStatus;
  isFollowUp?: boolean;
  parentBriefingId?: string;
  notes?: string;
  createdAt: string;
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'On Leave' | 'Excused';

export interface AttendanceRecord {
  id: string;
  briefingSessionId: string;
  userId: string;
  userName: string;
  userEmail: string;
  departmentId: string;
  status: AttendanceStatus;
  remarks?: string;
  markedByUserId: string;
  markedByName: string;
  markedAt: string;
}

export interface AttendanceSummary {
  briefingSessionId: string;
  briefingTitle: string;
  departmentName: string;
  dateTime: string;
  totalUsers: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  onLeaveCount: number;
  excusedCount: number;
  attendancePercentage: number;
  recommendFollowUp: boolean;
  recommendReason: string;
}

export interface Notification {
  id: string;
  recipientUserId: string;
  title: string;
  message: string;
  type: 'registration' | 'leave_submitted' | 'leave_status' | 'briefing_scheduled' | 'briefing_reminder' | 'followup_briefing' | 'attendance_marked';
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}

export interface EmailLog {
  id: string;
  recipientEmail: string;
  recipientName: string;
  departmentName: string;
  subject: string;
  eventType: string;
  contentHtml: string;
  sentAt: string;
  status: 'Sent' | 'Failed';
}

export interface NotificationTemplate {
  id: string;
  eventType: string;
  name: string;
  subjectTemplate: string;
  bodyTemplate: string;
  updatedAt: string;
}

export type AuditActionType =
  | 'Registration'
  | 'Login'
  | 'Department Change'
  | 'Leave Submission'
  | 'Leave Amendment'
  | 'Leave Cancellation'
  | 'Attendance Submission'
  | 'Briefing Schedule Creation'
  | 'Email Notification Sent'
  | 'User Role Update'
  | 'Department Management';

export interface AuditLog {
  id: string;
  actionType: AuditActionType;
  performedByUserId: string;
  performedByName: string;
  performedByEmail: string;
  timestamp: string;
  oldValue?: string;
  newValue?: string;
  remarks?: string;
}
