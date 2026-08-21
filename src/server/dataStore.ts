import fs from 'fs';
import path from 'path';
import {
  User,
  Department,
  LeaveRequest,
  BriefingSession,
  AttendanceRecord,
  AttendanceSummary,
  Notification,
  EmailLog,
  NotificationTemplate,
  AuditLog,
  AuditActionType,
} from '../types';
import {
  initialUsers,
  initialDepartments,
  initialLeaveRequests,
  initialBriefingSessions,
  initialAttendanceRecords,
  initialNotifications,
  initialNotificationTemplates,
  initialEmailLogs,
  initialAuditLogs,
} from './initialData';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface DatabaseSchema {
  users: User[];
  departments: Department[];
  leaveRequests: LeaveRequest[];
  briefingSessions: BriefingSession[];
  attendanceRecords: AttendanceRecord[];
  notifications: Notification[];
  notificationTemplates: NotificationTemplate[];
  emailLogs: EmailLog[];
  auditLogs: AuditLog[];
}

let dbData: DatabaseSchema = {
  users: [...initialUsers],
  departments: [...initialDepartments],
  leaveRequests: [...initialLeaveRequests],
  briefingSessions: [...initialBriefingSessions],
  attendanceRecords: [...initialAttendanceRecords],
  notifications: [...initialNotifications],
  notificationTemplates: [...initialNotificationTemplates],
  emailLogs: [...initialEmailLogs],
  auditLogs: [...initialAuditLogs],
};

function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      dbData = {
        users: parsed.users || initialUsers,
        departments: parsed.departments || initialDepartments,
        leaveRequests: parsed.leaveRequests || initialLeaveRequests,
        briefingSessions: parsed.briefingSessions || initialBriefingSessions,
        attendanceRecords: parsed.attendanceRecords || initialAttendanceRecords,
        notifications: parsed.notifications || initialNotifications,
        notificationTemplates: parsed.notificationTemplates || initialNotificationTemplates,
        emailLogs: parsed.emailLogs || initialEmailLogs,
        auditLogs: parsed.auditLogs || initialAuditLogs,
      };
    } else {
      saveDb();
    }
  } catch (err) {
    console.error('Failed to load DB file, using in-memory defaults:', err);
  }
}

function saveDb() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save DB file:', err);
  }
}

// Load on start
loadDb();

export const dataStore = {
  // Users
  getUsers: (): User[] => dbData.users,
  getUserById: (id: string): User | undefined => dbData.users.find(u => u.id === id),
  getUserByEmail: (email: string): User | undefined => dbData.users.find(u => u.email.toLowerCase() === email.toLowerCase()),
  
  createUser: (user: Omit<User, 'id' | 'createdAt' | 'lastLoginAt'>): User => {
    const newUser: User = {
      ...user,
      id: `usr-${Date.now()}`,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    dbData.users.push(newUser);
    saveDb();
    
    dataStore.addAuditLog({
      actionType: 'Registration',
      performedByUserId: newUser.id,
      performedByName: newUser.name,
      performedByEmail: newUser.email,
      newValue: `Registered user ${newUser.name} (${newUser.email}) in ${newUser.departmentName}`,
      remarks: 'Google OAuth registration completed',
    });

    // Send Registration Email
    dataStore.sendEmailNotification(
      'registration',
      newUser.id,
      newUser.email,
      newUser.name,
      newUser.departmentName,
      `User ID: ${newUser.id} (${newUser.role})`,
      new Date().toLocaleDateString('en-US', { dateStyle: 'medium' }),
      '/profile'
    );

    return newUser;
  },

  updateUser: (id: string, updates: Partial<User>, performer?: { id: string; name: string; email: string }): User => {
    const idx = dbData.users.findIndex(u => u.id === id);
    if (idx === -1) throw new Error('User not found');
    
    const oldUser = { ...dbData.users[idx] };
    dbData.users[idx] = { ...dbData.users[idx], ...updates };
    saveDb();

    if (updates.departmentId && updates.departmentId !== oldUser.departmentId) {
      dataStore.addAuditLog({
        actionType: 'Department Change',
        performedByUserId: performer?.id || id,
        performedByName: performer?.name || oldUser.name,
        performedByEmail: performer?.email || oldUser.email,
        oldValue: oldUser.departmentName,
        newValue: dbData.users[idx].departmentName,
        remarks: `Department updated for ${dbData.users[idx].name}`,
      });
    }

    if (updates.role && updates.role !== oldUser.role) {
      dataStore.addAuditLog({
        actionType: 'User Role Update',
        performedByUserId: performer?.id || 'admin',
        performedByName: performer?.name || 'Admin',
        performedByEmail: performer?.email || 'admin@acmecorp.com',
        oldValue: oldUser.role,
        newValue: updates.role,
        remarks: `Role modified for ${dbData.users[idx].name}`,
      });
    }

    return dbData.users[idx];
  },

  deleteUser: (id: string): void => {
    const u = dbData.users.find(user => user.id === id);
    dbData.users = dbData.users.filter(user => user.id !== id);
    saveDb();
    if (u) {
      dataStore.addAuditLog({
        actionType: 'User Role Update',
        performedByUserId: 'admin',
        performedByName: 'Admin',
        performedByEmail: 'admin@acmecorp.com',
        oldValue: `User ${u.name} (${u.email})`,
        newValue: 'Deleted',
        remarks: 'User account removed',
      });
    }
  },

  // Departments
  getDepartments: (): Department[] => dbData.departments,
  createDepartment: (dept: Omit<Department, 'id' | 'createdAt'>): Department => {
    const newDept: Department = {
      ...dept,
      id: `dept-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    dbData.departments.push(newDept);
    saveDb();
    dataStore.addAuditLog({
      actionType: 'Department Management',
      performedByUserId: 'admin',
      performedByName: 'Admin',
      performedByEmail: 'admin@acmecorp.com',
      newValue: `Created department ${newDept.name} (${newDept.code})`,
    });
    return newDept;
  },

  updateDepartment: (id: string, updates: Partial<Department>): Department => {
    const idx = dbData.departments.findIndex(d => d.id === id);
    if (idx === -1) throw new Error('Department not found');
    const old = { ...dbData.departments[idx] };
    dbData.departments[idx] = { ...dbData.departments[idx], ...updates };
    saveDb();
    dataStore.addAuditLog({
      actionType: 'Department Management',
      performedByUserId: 'admin',
      performedByName: 'Admin',
      performedByEmail: 'admin@acmecorp.com',
      oldValue: old.name,
      newValue: dbData.departments[idx].name,
    });
    return dbData.departments[idx];
  },

  deleteDepartment: (id: string): void => {
    const d = dbData.departments.find(dept => dept.id === id);
    dbData.departments = dbData.departments.filter(dept => dept.id !== id);
    saveDb();
    if (d) {
      dataStore.addAuditLog({
        actionType: 'Department Management',
        performedByUserId: 'admin',
        performedByName: 'Admin',
        performedByEmail: 'admin@acmecorp.com',
        oldValue: d.name,
        newValue: 'Deleted',
      });
    }
  },

  // Leave Requests
  getLeaveRequests: (filters?: { userId?: string; departmentId?: string }): LeaveRequest[] => {
    let result = [...dbData.leaveRequests];
    if (filters?.userId) {
      result = result.filter(r => r.userId === filters.userId);
    }
    if (filters?.departmentId) {
      result = result.filter(r => r.departmentId === filters.departmentId);
    }
    return result;
  },

  checkLeaveOverlap: (userId: string, startDate: string, endDate: string, excludeId?: string): boolean => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    return dbData.leaveRequests.some(req => {
      if (req.userId !== userId) return false;
      if (excludeId && req.id === excludeId) return false;
      if (req.status === 'Cancelled' || req.status === 'Rejected') return false;

      const reqStart = new Date(req.startDate).getTime();
      const reqEnd = new Date(req.endDate).getTime();

      // Check date range collision
      return Math.max(start, reqStart) <= Math.min(end, reqEnd);
    });
  },

  createLeaveRequest: (req: Omit<LeaveRequest, 'id' | 'createdAt' | 'updatedAt'>): LeaveRequest => {
    if (dataStore.checkLeaveOverlap(req.userId, req.startDate, req.endDate)) {
      throw new Error('Overlapping leave request already exists for these dates.');
    }

    const newReq: LeaveRequest = {
      ...req,
      id: `lv-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dbData.leaveRequests.push(newReq);
    saveDb();

    dataStore.addAuditLog({
      actionType: 'Leave Submission',
      performedByUserId: newReq.userId,
      performedByName: newReq.userName,
      performedByEmail: newReq.userEmail,
      newValue: `Submitted ${newReq.leaveType} (${newReq.startDate} to ${newReq.endDate}, ${newReq.totalDays} day(s))`,
      remarks: `Reason: ${newReq.reason}`,
    });

    // Notify user & Super Users/Admins
    dataStore.sendEmailNotification(
      'leave_submitted',
      newReq.userId,
      newReq.userEmail,
      newReq.userName,
      newReq.departmentName,
      `${newReq.leaveType} (${newReq.totalDays} day(s)) - Status: ${newReq.status}`,
      `${newReq.startDate} to ${newReq.endDate}`,
      '/leave-history'
    );

    return newReq;
  },

  updateLeaveRequest: (id: string, updates: Partial<LeaveRequest>, reviewer?: { id: string; name: string; email: string }): LeaveRequest => {
    const idx = dbData.leaveRequests.findIndex(r => r.id === id);
    if (idx === -1) throw new Error('Leave request not found');

    const old = dbData.leaveRequests[idx];

    // Check overlap if dates are updated
    const newStart = updates.startDate || old.startDate;
    const newEnd = updates.endDate || old.endDate;
    if ((updates.startDate || updates.endDate) && (newStart !== old.startDate || newEnd !== old.endDate)) {
      if (dataStore.checkLeaveOverlap(old.userId, newStart, newEnd, id)) {
        throw new Error('Updated dates overlap with another active leave request.');
      }
    }

    const isCancellation = updates.status === 'Cancelled';
    const isAmendment = !isCancellation && (updates.startDate || updates.endDate || updates.reason || updates.leaveType);

    dbData.leaveRequests[idx] = {
      ...dbData.leaveRequests[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
      ...(reviewer ? { reviewedBy: reviewer.name, reviewedAt: new Date().toISOString() } : {}),
    };
    saveDb();

    const updatedReq = dbData.leaveRequests[idx];

    dataStore.addAuditLog({
      actionType: isCancellation ? 'Leave Cancellation' : isAmendment ? 'Leave Amendment' : 'Leave Submission',
      performedByUserId: reviewer?.id || updatedReq.userId,
      performedByName: reviewer?.name || updatedReq.userName,
      performedByEmail: reviewer?.email || updatedReq.userEmail,
      oldValue: `Status: ${old.status}, Dates: ${old.startDate} to ${old.endDate}`,
      newValue: `Status: ${updatedReq.status}, Dates: ${updatedReq.startDate} to ${updatedReq.endDate}`,
      remarks: updates.reviewRemarks || updates.reason || 'Leave record updated',
    });

    // Send email notification on status change or amendment
    dataStore.sendEmailNotification(
      'leave_status',
      updatedReq.userId,
      updatedReq.userEmail,
      updatedReq.userName,
      updatedReq.departmentName,
      `${updatedReq.leaveType} status changed to ${updatedReq.status}`,
      `${updatedReq.startDate} to ${updatedReq.endDate}`,
      '/leave-history'
    );

    return updatedReq;
  },

  // Briefing Sessions
  getBriefingSessions: (departmentId?: string): BriefingSession[] => {
    let result = [...dbData.briefingSessions];
    if (departmentId) {
      result = result.filter(b => b.departmentId === departmentId);
    }
    return result.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
  },

  createBriefingSession: (session: Omit<BriefingSession, 'id' | 'createdAt'>): BriefingSession => {
    const newSession: BriefingSession = {
      ...session,
      id: `brf-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    dbData.briefingSessions.push(newSession);
    saveDb();

    dataStore.addAuditLog({
      actionType: 'Briefing Schedule Creation',
      performedByUserId: newSession.createdByUserId,
      performedByName: newSession.createdByName,
      performedByEmail: '',
      newValue: `Created briefing session: ${newSession.title} (${newSession.departmentName}) on ${newSession.dateTime}`,
    });

    // Notify all users in department
    const deptUsers = dbData.users.filter(u => u.departmentId === newSession.departmentId && u.status === 'Active');
    const eventType = newSession.isFollowUp ? 'followup_briefing' : 'briefing_scheduled';
    const formattedDate = new Date(newSession.dateTime).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    deptUsers.forEach(user => {
      dataStore.sendEmailNotification(
        eventType,
        user.id,
        user.email,
        user.name,
        user.departmentName,
        newSession.title,
        formattedDate,
        '/briefings'
      );
    });

    return newSession;
  },

  updateBriefingSession: (id: string, updates: Partial<BriefingSession>): BriefingSession => {
    const idx = dbData.briefingSessions.findIndex(b => b.id === id);
    if (idx === -1) throw new Error('Briefing session not found');
    dbData.briefingSessions[idx] = { ...dbData.briefingSessions[idx], ...updates };
    saveDb();
    return dbData.briefingSessions[idx];
  },

  // Attendance Records & Auto "On Leave" Suggestions
  getAttendanceRecords: (briefingSessionId?: string): AttendanceRecord[] => {
    if (briefingSessionId) {
      return dbData.attendanceRecords.filter(a => a.briefingSessionId === briefingSessionId);
    }
    return dbData.attendanceRecords;
  },

  getAutoOnLeaveSuggestions: (briefingSessionId: string): Record<string, boolean> => {
    const briefing = dbData.briefingSessions.find(b => b.id === briefingSessionId);
    if (!briefing) return {};

    const briefingDateStr = briefing.dateTime.split('T')[0];
    const briefingTime = new Date(briefingDateStr).getTime();

    const result: Record<string, boolean> = {};

    dbData.leaveRequests.forEach(req => {
      if (req.departmentId !== briefing.departmentId) return;
      if (req.status !== 'Approved') return;

      const reqStart = new Date(req.startDate).getTime();
      const reqEnd = new Date(req.endDate).getTime();

      if (briefingTime >= reqStart && briefingTime <= reqEnd) {
        result[req.userId] = true;
      }
    });

    return result;
  },

  saveAttendanceRecords: (
    briefingSessionId: string,
    records: { userId: string; userName: string; userEmail: string; status: AttendanceRecord['status']; remarks?: string }[],
    markedByUserId: string,
    markedByName: string
  ): { records: AttendanceRecord[]; summary: AttendanceSummary } => {
    const briefing = dbData.briefingSessions.find(b => b.id === briefingSessionId);
    if (!briefing) throw new Error('Briefing session not found');

    const markedAt = new Date().toISOString();

    // Clear existing for this session and push new
    dbData.attendanceRecords = dbData.attendanceRecords.filter(a => a.briefingSessionId !== briefingSessionId);

    const createdRecords: AttendanceRecord[] = records.map(r => ({
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      briefingSessionId,
      userId: r.userId,
      userName: r.userName,
      userEmail: r.userEmail,
      departmentId: briefing.departmentId,
      status: r.status,
      remarks: r.remarks || '',
      markedByUserId,
      markedByName,
      markedAt,
    }));

    dbData.attendanceRecords.push(...createdRecords);

    // Update briefing status to Completed
    const bIdx = dbData.briefingSessions.findIndex(b => b.id === briefingSessionId);
    if (bIdx !== -1) {
      dbData.briefingSessions[bIdx].status = 'Completed';
    }

    saveDb();

    // Summary calculation
    const summary = dataStore.calculateAttendanceSummary(briefingSessionId);

    // Audit log
    dataStore.addAuditLog({
      actionType: 'Attendance Submission',
      performedByUserId: markedByUserId,
      performedByName: markedByName,
      performedByEmail: '',
      newValue: `Recorded attendance for "${briefing.title}" (${summary.presentCount}/${summary.totalUsers} Present - ${summary.attendancePercentage}%)`,
      remarks: summary.recommendFollowUp ? `Follow-up recommended: ${summary.recommendReason}` : 'Attendance satisfactory',
    });

    // Notify users
    const formattedDate = new Date(briefing.dateTime).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
    records.forEach(r => {
      dataStore.sendEmailNotification(
        'attendance_marked',
        r.userId,
        r.userEmail,
        r.userName,
        briefing.departmentName,
        `${briefing.title} - Status: ${r.status}`,
        formattedDate,
        `/attendance/summary/${briefingSessionId}`
      );
    });

    return { records: createdRecords, summary };
  },

  calculateAttendanceSummary: (briefingSessionId: string): AttendanceSummary => {
    const briefing = dbData.briefingSessions.find(b => b.id === briefingSessionId);
    if (!briefing) throw new Error('Briefing session not found');

    const records = dbData.attendanceRecords.filter(a => a.briefingSessionId === briefingSessionId);
    const deptUsers = dbData.users.filter(u => u.departmentId === briefing.departmentId && u.status === 'Active');
    const totalUsers = Math.max(deptUsers.length, records.length);

    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let onLeaveCount = 0;
    let excusedCount = 0;

    records.forEach(r => {
      if (r.status === 'Present') presentCount++;
      else if (r.status === 'Absent') absentCount++;
      else if (r.status === 'Late') lateCount++;
      else if (r.status === 'On Leave') onLeaveCount++;
      else if (r.status === 'Excused') excusedCount++;
    });

    const attendancePercentage = totalUsers > 0 ? Math.round((presentCount / totalUsers) * 100) : 0;
    const nonPresentRatio = totalUsers > 0 ? (absentCount + lateCount + onLeaveCount) / totalUsers : 0;

    let recommendFollowUp = false;
    let recommendReason = '';

    if (attendancePercentage < 80) {
      recommendFollowUp = true;
      recommendReason = `Overall attendance rate (${attendancePercentage}%) is below the required 80% threshold.`;
    } else if (nonPresentRatio > 0.2) {
      recommendFollowUp = true;
      recommendReason = `More than 20% of department members were absent, late, or on leave (${Math.round(nonPresentRatio * 100)}% affected).`;
    }

    return {
      briefingSessionId,
      briefingTitle: briefing.title,
      departmentName: briefing.departmentName,
      dateTime: briefing.dateTime,
      totalUsers,
      presentCount,
      absentCount,
      lateCount,
      onLeaveCount,
      excusedCount,
      attendancePercentage,
      recommendFollowUp,
      recommendReason,
    };
  },

  // Smart Date Suggester for Follow-Up Briefings
  suggestNextBriefingDate: (departmentId: string): { suggestedDate: string; onLeaveCount: number; availableUsers: number; totalUsers: number } => {
    const deptUsers = dbData.users.filter(u => u.departmentId === departmentId && u.status === 'Active');
    const totalUsers = deptUsers.length;

    const today = new Date();
    let bestDate = '';
    let minOnLeave = Infinity;
    let bestAvailable = 0;

    // Scan next 14 weekdays
    for (let dayOffset = 2; dayOffset <= 16; dayOffset++) {
      const candidate = new Date();
      candidate.setDate(today.getDate() + dayOffset);
      const dayOfWeek = candidate.getDay();
      
      // Skip weekends
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      const candidateStr = candidate.toISOString().split('T')[0];
      const candidateTime = candidate.getTime();

      // Count users on approved leave on this day
      let onLeaveOnDay = 0;
      deptUsers.forEach(user => {
        const userLeaves = dbData.leaveRequests.filter(l => l.userId === user.id && l.status === 'Approved');
        const isLeave = userLeaves.some(l => {
          const s = new Date(l.startDate).getTime();
          const e = new Date(l.endDate).getTime();
          return candidateTime >= s && candidateTime <= e;
        });
        if (isLeave) onLeaveOnDay++;
      });

      if (onLeaveOnDay < minOnLeave) {
        minOnLeave = onLeaveOnDay;
        bestDate = candidateStr;
        bestAvailable = totalUsers - onLeaveOnDay;
      }
    }

    if (!bestDate) {
      const fallback = new Date();
      fallback.setDate(today.getDate() + 3);
      bestDate = fallback.toISOString().split('T')[0];
      minOnLeave = 0;
      bestAvailable = totalUsers;
    }

    return {
      suggestedDate: `${bestDate}T09:30:00`,
      onLeaveCount: minOnLeave,
      availableUsers: bestAvailable,
      totalUsers,
    };
  },

  // Notifications & Emails
  getNotifications: (userId?: string): Notification[] => {
    if (userId) {
      return dbData.notifications
        .filter(n => n.recipientUserId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return dbData.notifications;
  },

  markNotificationRead: (id: string): void => {
    const n = dbData.notifications.find(item => item.id === id);
    if (n) {
      n.isRead = true;
      saveDb();
    }
  },

  markAllNotificationsRead: (userId: string): void => {
    dbData.notifications.forEach(n => {
      if (n.recipientUserId === userId) n.isRead = true;
    });
    saveDb();
  },

  getNotificationTemplates: (): NotificationTemplate[] => dbData.notificationTemplates,

  updateNotificationTemplate: (id: string, updates: Partial<NotificationTemplate>): NotificationTemplate => {
    const idx = dbData.notificationTemplates.findIndex(t => t.id === id);
    if (idx === -1) throw new Error('Template not found');
    dbData.notificationTemplates[idx] = {
      ...dbData.notificationTemplates[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveDb();
    return dbData.notificationTemplates[idx];
  },

  getEmailLogs: (): EmailLog[] => dbData.emailLogs.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()),

  sendEmailNotification: (
    eventType: string,
    recipientUserId: string,
    recipientEmail: string,
    recipientName: string,
    departmentName: string,
    details: string,
    dateTime: string,
    actionUrl: string
  ): EmailLog => {
    const template = dbData.notificationTemplates.find(t => t.eventType === eventType) || dbData.notificationTemplates[0];

    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const fullActionUrl = actionUrl.startsWith('http') ? actionUrl : `${appUrl}${actionUrl}`;

    const subject = template.subjectTemplate
      .replace(/{recipient_name}/g, recipientName)
      .replace(/{department}/g, departmentName)
      .replace(/{details}/g, details)
      .replace(/{date_time}/g, dateTime)
      .replace(/{action_url}/g, fullActionUrl);

    const body = template.bodyTemplate
      .replace(/{recipient_name}/g, recipientName)
      .replace(/{department}/g, departmentName)
      .replace(/{details}/g, details)
      .replace(/{date_time}/g, dateTime)
      .replace(/{action_url}/g, fullActionUrl);

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #1e293b; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">LeavePlan & Attendance Hub</h2>
        <div style="white-space: pre-wrap; font-size: 14px; color: #334155; line-height: 1.6;">${body}</div>
        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8;">
          This is an automated notification from LeavePlan & Attendance Hub.
        </div>
      </div>
    `;

    const emailLog: EmailLog = {
      id: `eml-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      recipientEmail,
      recipientName,
      departmentName,
      subject,
      eventType,
      contentHtml: htmlContent,
      sentAt: new Date().toISOString(),
      status: 'Sent',
    };

    dbData.emailLogs.push(emailLog);

    // Create in-app notification
    const newNotif: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      recipientUserId,
      title: subject,
      message: `${details} (${dateTime})`,
      type: eventType as any,
      isRead: false,
      actionUrl,
      createdAt: new Date().toISOString(),
    };
    dbData.notifications.push(newNotif);

    saveDb();

    // Audit email event
    dataStore.addAuditLog({
      actionType: 'Email Notification Sent',
      performedByUserId: 'system',
      performedByName: 'Notification System',
      performedByEmail: 'noreply@acmecorp.com',
      newValue: `Sent email [${eventType}] to ${recipientEmail} (${subject})`,
    });

    return emailLog;
  },

  // Audit Logs
  getAuditLogs: (): AuditLog[] => dbData.auditLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),

  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog => {
    const newLog: AuditLog = {
      ...log,
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      timestamp: new Date().toISOString(),
    };
    dbData.auditLogs.push(newLog);
    saveDb();
    return newLog;
  },
};
