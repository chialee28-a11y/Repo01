import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  LeaveRequest,
  BriefingSession,
  User,
  Department,
  AttendanceSummary,
  Notification,
} from '../types';
import { StatusBadge } from '../components/StatusBadge';
import {
  CalendarPlus,
  CheckSquare,
  Users,
  Building,
  Clock,
  Calendar,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  Bell,
  Sparkles,
  CheckCircle,
  FileCheck,
  Building2,
  ChevronRight,
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);

  // Common data
  const [userLeaves, setUserLeaves] = useState<LeaveRequest[]>([]);
  const [upcomingBriefings, setUpcomingBriefings] = useState<BriefingSession[]>([]);
  const [todayBriefings, setTodayBriefings] = useState<BriefingSession[]>([]);
  const [completedBriefings, setCompletedBriefings] = useState<BriefingSession[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Admin stats
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allDepartments, setAllDepartments] = useState<Department[]>([]);
  const [allLeaves, setAllLeaves] = useState<LeaveRequest[]>([]);
  const [deptSummaries, setDeptSummaries] = useState<AttendanceSummary[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentUser) return;
      setLoading(true);
      try {
        const [leaves, briefings, notifs] = await Promise.all([
          api.getLeaveRequests({ userId: currentUser.id }),
          api.getBriefingSessions(currentUser.departmentId),
          api.getNotifications(currentUser.id),
        ]);

        setUserLeaves(leaves);
        setNotifications(notifs);

        const now = new Date();
        const upcoming = briefings.filter(
          b => b.status === 'Planned' && new Date(b.dateTime) >= now
        );
        const today = briefings.filter(b => {
          const bDate = new Date(b.dateTime).toISOString().split('T')[0];
          const todayStr = now.toISOString().split('T')[0];
          return bDate === todayStr;
        });
        const completed = briefings.filter(b => b.status === 'Completed');

        setUpcomingBriefings(upcoming);
        setTodayBriefings(today);
        setCompletedBriefings(completed);

        // Additional data for Super User & Admin
        if (currentUser.role === 'Admin' || currentUser.role === 'Super User') {
          const [users, depts, totalLeaves] = await Promise.all([
            api.getUsers(),
            api.getDepartments(),
            api.getLeaveRequests(),
          ]);
          setAllUsers(users);
          setAllDepartments(depts);
          setAllLeaves(totalLeaves);

          // Summaries for completed briefings
          const summaries = await Promise.all(
            completed.map(b => api.getAttendanceSummary(b.id).catch(() => null))
          );
          setDeptSummaries(summaries.filter(Boolean) as AttendanceSummary[]);
        }
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentUser]);

  if (!currentUser) return null;

  const isNormalUser = currentUser.role === 'Normal User';
  const isSuperUser = currentUser.role === 'Super User';
  const isAdmin = currentUser.role === 'Admin';

  // Stats calculation
  const approvedLeavesCount = userLeaves.filter(l => l.status === 'Approved').length;
  const pendingLeavesCount = userLeaves.filter(l => l.status === 'Submitted').length;
  const totalDaysTaken = userLeaves
    .filter(l => l.status === 'Approved')
    .reduce((sum, l) => sum + l.totalDays, 0);

  const upcomingLeaves = userLeaves
    .filter(l => l.status === 'Approved' && new Date(l.startDate) >= new Date())
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  // Pending attendance taking for Super User
  const pendingAttendanceSessions = upcomingBriefings.filter(b => {
    const bDate = new Date(b.dateTime);
    return bDate <= new Date() || b.status === 'Planned';
  });

  const recommendedFollowups = deptSummaries.filter(s => s.recommendFollowUp);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 bg-indigo-500/20 backdrop-blur-md px-3 py-1 rounded-full text-indigo-300 text-xs font-semibold mb-3 border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{currentUser.departmentName} Department</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome back, {currentUser.name}!
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-300">
              {isNormalUser && 'Manage your leave plans, track briefing schedules, and review company updates.'}
              {isSuperUser && 'Monitor department attendance, mark session records, and manage follow-up briefings.'}
              {isAdmin && 'Oversee organization-wide leave metrics, department roles, and email notifications.'}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {isNormalUser && (
              <button
                onClick={() => onNavigate('submit-leave')}
                className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <CalendarPlus className="w-4 h-4 mr-2" />
                Submit Leave
              </button>
            )}

            {(isSuperUser || isAdmin) && (
              <button
                onClick={() => onNavigate('take-attendance')}
                className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <CheckSquare className="w-4 h-4 mr-2" />
                Take Attendance
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => onNavigate('admin-users')}
                className="inline-flex items-center px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
              >
                <Users className="w-4 h-4 mr-2" />
                Manage Users
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ================= NORMAL USER DASHBOARD ================= */}
      {isNormalUser && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (Stats & Upcoming Leave) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500">Approved Leave</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{approvedLeavesCount}</p>
                  <p className="text-[10px] text-emerald-600 font-medium mt-0.5">
                    {totalDaysTaken} total day(s)
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500">Pending Review</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{pendingLeavesCount}</p>
                  <p className="text-[10px] text-amber-600 font-medium mt-0.5">Awaiting approval</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500">Upcoming Briefings</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{upcomingBriefings.length}</p>
                  <p className="text-[10px] text-indigo-600 font-medium mt-0.5">Department sessions</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Upcoming Approved Leave */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-indigo-600" />
                  1. Upcoming Leave Schedule
                </h3>
                <button
                  onClick={() => onNavigate('leave-history')}
                  className="text-xs text-indigo-600 font-semibold hover:underline flex items-center"
                >
                  View History <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </button>
              </div>

              {upcomingLeaves.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-xs text-slate-500">No upcoming leave scheduled.</p>
                  <button
                    onClick={() => onNavigate('submit-leave')}
                    className="mt-2 text-xs font-bold text-indigo-600 hover:underline"
                  >
                    Submit a new leave request
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingLeaves.map(leave => (
                    <div
                      key={leave.id}
                      className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-slate-900">{leave.leaveType}</span>
                          <StatusBadge status={leave.status} size="sm" />
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          {leave.startDate} to {leave.endDate} ({leave.totalDays} day - {leave.dayOption})
                        </p>
                        {leave.reason && (
                          <p className="text-[11px] text-slate-400 mt-0.5 italic">"{leave.reason}"</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming Briefing Sessions */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center">
                  <FileCheck className="w-4 h-4 mr-2 text-indigo-600" />
                  3. Upcoming Briefing Sessions
                </h3>
                <button
                  onClick={() => onNavigate('briefings')}
                  className="text-xs text-indigo-600 font-semibold hover:underline flex items-center"
                >
                  View All <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </button>
              </div>

              {upcomingBriefings.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-xs text-slate-500">No upcoming briefings scheduled for your department.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingBriefings.map(b => (
                    <div
                      key={b.id}
                      className="p-4 bg-indigo-50/40 rounded-xl border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <span className="text-xs font-bold text-indigo-900">{b.title}</span>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {new Date(b.dateTime).toLocaleString([], {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">📍 Location: {b.location}</p>
                      </div>

                      {b.meetingLink && (
                        <a
                          href={b.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold inline-flex items-center justify-center shadow-sm"
                        >
                          Join Online
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column (Notifications Summary) */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center">
                  <Bell className="w-4 h-4 mr-2 text-indigo-600" />
                  4. Notification Summary
                </h3>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No recent notifications</p>
                ) : (
                  notifications.slice(0, 5).map(n => (
                    <div
                      key={n.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1"
                    >
                      <div className="font-semibold text-slate-900">{n.title}</div>
                      <div className="text-slate-600">{n.message}</div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= SUPER USER DASHBOARD ================= */}
      {isSuperUser && (
        <div className="space-y-6">
          {/* Top Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <p className="text-xs font-semibold text-slate-500">Today's Briefings</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{todayBriefings.length}</p>
              <p className="text-[10px] text-indigo-600 font-medium mt-0.5">
                {todayBriefings.filter(b => b.status === 'Completed').length} marked complete
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <p className="text-xs font-semibold text-slate-500">Pending Attendance Tasks</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{pendingAttendanceSessions.length}</p>
              <p className="text-[10px] text-amber-700 font-medium mt-0.5">Requires Super User action</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <p className="text-xs font-semibold text-slate-500">Completed Sessions</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{completedBriefings.length}</p>
              <p className="text-[10px] text-emerald-700 font-medium mt-0.5">Attendance recorded</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <p className="text-xs font-semibold text-slate-500">Follow-Up Recommended</p>
              <p className="text-2xl font-bold text-rose-600 mt-1">{recommendedFollowups.length}</p>
              <p className="text-[10px] text-rose-700 font-medium mt-0.5">Due to low attendance / leave</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Today's Briefings & Pending Attendance Tasks */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center">
                  <CheckSquare className="w-4 h-4 mr-2 text-indigo-600" />
                  1. Today's Briefings & Pending Attendance Tasks
                </h3>
                <button
                  onClick={() => onNavigate('take-attendance')}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
                >
                  Take Attendance
                </button>
              </div>

              {pendingAttendanceSessions.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-xs text-slate-500">All attendance tasks are completed!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingAttendanceSessions.map(b => (
                    <div
                      key={b.id}
                      className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between"
                    >
                      <div>
                        <span className="text-xs font-bold text-slate-900">{b.title}</span>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          📅 {new Date(b.dateTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                        <p className="text-[11px] text-slate-500">📍 {b.location}</p>
                      </div>

                      <button
                        onClick={() => onNavigate('take-attendance', { sessionId: b.id })}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                      >
                        Mark Attendance
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recommended Follow-up Briefings */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2 text-rose-600" />
                  4. Recommended Follow-up Briefings
                </h3>
                <button
                  onClick={() => onNavigate('followup-scheduler')}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold"
                >
                  Scheduler Tool
                </button>
              </div>

              {recommendedFollowups.length === 0 ? (
                <div className="text-center py-8 bg-emerald-50 rounded-xl border border-emerald-100">
                  <p className="text-xs font-semibold text-emerald-800">
                    No follow-ups needed! All briefing sessions achieved ≥80% attendance.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recommendedFollowups.map(s => (
                    <div
                      key={s.briefingSessionId}
                      className="p-4 bg-rose-50/80 rounded-xl border border-rose-200 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-rose-950">{s.briefingTitle}</span>
                        <span className="px-2 py-0.5 bg-rose-200 text-rose-800 font-bold text-[10px] rounded-full">
                          {s.attendancePercentage}% Attendance
                        </span>
                      </div>

                      <p className="text-xs text-rose-700">{s.recommendReason}</p>

                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => onNavigate('followup-scheduler', { sessionId: s.briefingSessionId })}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm inline-flex items-center"
                        >
                          <Sparkles className="w-3.5 h-3.5 mr-1" /> Schedule Follow-up Now
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= ADMIN DASHBOARD ================= */}
      {isAdmin && (
        <div className="space-y-6">
          {/* Admin KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <p className="text-xs font-semibold text-slate-500">1. Total Users</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{allUsers.length}</p>
              <p className="text-[10px] text-indigo-600 font-medium mt-0.5">
                {allUsers.filter(u => u.status === 'Active').length} Active employees
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <p className="text-xs font-semibold text-slate-500">2. Departments</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{allDepartments.length}</p>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">Active corporate units</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <p className="text-xs font-semibold text-slate-500">3. Total Leave Submissions</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{allLeaves.length}</p>
              <p className="text-[10px] text-emerald-600 font-medium mt-0.5">
                {allLeaves.filter(l => l.status === 'Approved').length} Approved
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <p className="text-xs font-semibold text-slate-500">4. Briefings Recorded</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{completedBriefings.length}</p>
              <p className="text-[10px] text-indigo-600 font-medium mt-0.5">Attendance locked</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <p className="text-xs font-semibold text-slate-500">5. Avg Participation</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {deptSummaries.length > 0
                  ? Math.round(
                      deptSummaries.reduce((acc, curr) => acc + curr.attendancePercentage, 0) /
                        deptSummaries.length
                    )
                  : 85}
                %
              </p>
              <p className="text-[10px] text-emerald-700 font-medium mt-0.5">Target: ≥80%</p>
            </div>
          </div>

          {/* Department Breakdown & Participation Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Users by Department */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center">
                  <Building2 className="w-4 h-4 mr-2 text-indigo-600" />
                  2. Users by Department
                </h3>
                <button
                  onClick={() => onNavigate('admin-departments')}
                  className="text-xs font-semibold text-indigo-600 hover:underline"
                >
                  Manage
                </button>
              </div>

              <div className="space-y-3">
                {allDepartments.map(dept => {
                  const count = allUsers.filter(u => u.departmentId === dept.id).length;
                  const pct = Math.round((count / Math.max(allUsers.length, 1)) * 100);

                  return (
                    <div key={dept.id} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-800">
                        <span>{dept.name} ({dept.code})</span>
                        <span>{count} employees ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Briefing Participation Trend */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2 text-emerald-600" />
                  5. Briefing Participation Trend
                </h3>
              </div>

              <div className="space-y-4">
                {deptSummaries.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-8">
                    No completed briefings recorded yet.
                  </p>
                ) : (
                  deptSummaries.map(s => (
                    <div
                      key={s.briefingSessionId}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900">{s.briefingTitle}</div>
                        <div className="text-[10px] text-slate-500">
                          {s.departmentName} • {s.presentCount}/{s.totalUsers} Present
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-sm font-bold ${
                            s.attendancePercentage >= 80 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {s.attendancePercentage}%
                        </span>
                        <div className="text-[10px] text-slate-400">
                          {s.recommendFollowUp ? 'Follow-up suggested' : 'Satisfactory'}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
