import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { BriefingSession, User, AttendanceStatus, AttendanceSummary } from '../types';
import { CheckSquare, Calendar, Users, AlertCircle, CheckCircle2, Sparkles, HelpCircle, ArrowLeft } from 'lucide-react';

interface TakeAttendancePageProps {
  onNavigate: (page: string, params?: any) => void;
  selectedSessionId?: string;
}

export const TakeAttendancePage: React.FC<TakeAttendancePageProps> = ({ onNavigate, selectedSessionId }) => {
  const { currentUser } = useAuth();
  const [sessions, setSessions] = useState<BriefingSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>(selectedSessionId || '');
  const [activeSession, setActiveSession] = useState<BriefingSession | null>(null);

  const [deptUsers, setDeptUsers] = useState<User[]>([]);
  const [autoLeaveMap, setAutoLeaveMap] = useState<Record<string, boolean>>({});

  // State map of userId -> { status, remarks }
  const [attendanceMap, setAttendanceMap] = useState<
    Record<string, { status: AttendanceStatus; remarks: string }>
  >({});

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successSummary, setSuccessSummary] = useState<AttendanceSummary | null>(null);

  useEffect(() => {
    api.getBriefingSessions().then(data => {
      setSessions(data);
      if (data.length > 0 && !activeSessionId) {
        setActiveSessionId(data[0].id);
      }
    });
  }, []);

  // When activeSessionId changes, load users and attendance records
  useEffect(() => {
    if (!activeSessionId) return;

    const loadSessionDetails = async () => {
      setLoading(true);
      setError('');
      try {
        const session = sessions.find(s => s.id === activeSessionId) || (await api.getBriefingSessions()).find(s => s.id === activeSessionId);
        if (!session) return;
        setActiveSession(session);

        const [allUsers, { records, autoSuggestions }] = await Promise.all([
          api.getUsers(),
          api.getAttendanceRecords(session.id),
        ]);

        const filteredUsers = allUsers.filter(u => u.departmentId === session.departmentId && u.status === 'Active');
        setDeptUsers(filteredUsers);
        setAutoLeaveMap(autoSuggestions);

        // Build attendance state
        const initialMap: Record<string, { status: AttendanceStatus; remarks: string }> = {};

        filteredUsers.forEach(u => {
          const existingRecord = records.find(r => r.userId === u.id);
          if (existingRecord) {
            initialMap[u.id] = { status: existingRecord.status, remarks: existingRecord.remarks || '' };
          } else if (autoSuggestions[u.id]) {
            // Auto suggest On Leave
            initialMap[u.id] = { status: 'On Leave', remarks: 'Auto-detected approved leave on session date' };
          } else {
            // Default Present
            initialMap[u.id] = { status: 'Present', remarks: '' };
          }
        });

        setAttendanceMap(initialMap);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadSessionDetails();
  }, [activeSessionId, sessions]);

  const handleStatusChange = (userId: string, status: AttendanceStatus) => {
    setAttendanceMap(prev => ({
      ...prev,
      [userId]: { ...prev[userId], status },
    }));
  };

  const handleRemarksChange = (userId: string, remarks: string) => {
    setAttendanceMap(prev => ({
      ...prev,
      [userId]: { ...prev[userId], remarks },
    }));
  };

  const handleApplyAllPresent = () => {
    setAttendanceMap(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(uid => {
        // Keep On Leave suggestions, update others
        if (!autoLeaveMap[uid]) {
          next[uid] = { ...next[uid], status: 'Present' };
        }
      });
      return next;
    });
  };

  const handleSubmitAttendance = async () => {
    if (!activeSession || !currentUser) return;

    setLoading(true);
    setError('');
    setShowConfirmModal(false);

    try {
      const recordsToSave = deptUsers.map(u => ({
        userId: u.id,
        userName: u.name,
        userEmail: u.email,
        status: attendanceMap[u.id]?.status || 'Present',
        remarks: attendanceMap[u.id]?.remarks || '',
      }));

      const res = await api.submitAttendance(
        activeSession.id,
        recordsToSave,
        currentUser.id,
        currentUser.name
      );

      setSuccessSummary(res.summary);
    } catch (err: any) {
      setError(err.message || 'Failed to submit attendance');
    } finally {
      setLoading(false);
    }
  };

  if (successSummary) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6 text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">Attendance Successfully Recorded!</h2>
            <p className="text-xs text-slate-500 mt-1">
              Session: <span className="font-semibold text-slate-800">{successSummary.briefingTitle}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total</span>
              <p className="text-lg font-bold text-slate-900">{successSummary.totalUsers}</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
              <span className="text-[10px] font-bold text-emerald-600 uppercase">Present</span>
              <p className="text-lg font-bold text-emerald-800">{successSummary.presentCount}</p>
            </div>
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
              <span className="text-[10px] font-bold text-rose-600 uppercase">Absent</span>
              <p className="text-lg font-bold text-rose-800">{successSummary.absentCount}</p>
            </div>
            <div className="p-3 bg-sky-50 rounded-xl border border-sky-100">
              <span className="text-[10px] font-bold text-sky-600 uppercase">On Leave</span>
              <p className="text-lg font-bold text-sky-800">{successSummary.onLeaveCount}</p>
            </div>
          </div>

          {/* Follow Up Recommendation Alert */}
          {successSummary.recommendFollowUp ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-left space-y-2">
              <div className="flex items-center space-x-2 text-rose-800 font-bold text-xs">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Follow-up Briefing Recommended ({successSummary.attendancePercentage}% Attendance)</span>
              </div>
              <p className="text-xs text-rose-700">{successSummary.recommendReason}</p>

              <button
                onClick={() => onNavigate('followup-scheduler', { sessionId: successSummary.briefingSessionId })}
                className="mt-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-md inline-flex items-center"
              >
                <Sparkles className="w-4 h-4 mr-1.5" />
                Schedule Follow-up Briefing Now
              </button>
            </div>
          ) : (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-left text-xs text-emerald-800 font-semibold flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
              Attendance achieved {successSummary.attendancePercentage}% threshold. No follow-up briefing required.
            </div>
          )}

          <div className="pt-4 flex justify-center space-x-3">
            <button
              onClick={() => {
                setSuccessSummary(null);
                onNavigate('briefings');
              }}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
            >
              Back to Briefings
            </button>
            <button
              onClick={() => onNavigate('attendance-summary', { sessionId: successSummary.briefingSessionId })}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-md"
            >
              View Detailed Summary
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <button
          onClick={() => onNavigate('briefings')}
          className="p-2 bg-white rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Take Session Attendance</h1>
          <p className="text-xs text-slate-500">Super User attendance recording for corporate briefings</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold">
          {error}
        </div>
      )}

      {/* Session Selection Dropdown */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Select Briefing Session *
          </label>
          <select
            value={activeSessionId}
            onChange={e => setActiveSessionId(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {sessions.map(s => (
              <option key={s.id} value={s.id}>
                {s.title} ({s.departmentName} - {new Date(s.dateTime).toLocaleDateString()})
              </option>
            ))}
          </select>
        </div>

        {activeSession && (
          <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-indigo-900">{activeSession.title}</span>
              <p className="text-slate-600 mt-0.5">
                📅 {new Date(activeSession.dateTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })} | 📍 {activeSession.location}
              </p>
            </div>
            <button
              onClick={handleApplyAllPresent}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-lg text-xs shadow-sm"
            >
              Mark Remaining Present
            </button>
          </div>
        )}
      </div>

      {/* User Attendance Marking List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center">
            <Users className="w-4 h-4 mr-2 text-indigo-600" />
            Department Member Checklist ({deptUsers.length} employees)
          </h3>
        </div>

        <div className="divide-y divide-slate-100 space-y-4">
          {deptUsers.map(user => {
            const isAutoOnLeave = autoLeaveMap[user.id];
            const currentAtt = attendanceMap[user.id] || { status: 'Present', remarks: '' };

            return (
              <div
                key={user.id}
                className="pt-4 first:pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Employee Info */}
                <div className="flex items-center space-x-3">
                  <img
                    src={user.avatarUrl || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'}
                    alt={user.name}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-900">{user.name}</span>
                      {isAutoOnLeave && (
                        <span className="px-2 py-0.5 bg-sky-100 text-sky-800 text-[10px] font-bold rounded-full flex items-center">
                          <Sparkles className="w-3 h-3 mr-1" /> Auto: Approved Leave
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">{user.email}</span>
                  </div>
                </div>

                {/* Status Radio Choices */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {(['Present', 'Absent', 'Late', 'On Leave', 'Excused'] as AttendanceStatus[]).map(status => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => handleStatusChange(user.id, status)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        currentAtt.status === status
                          ? status === 'Present'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : status === 'Absent'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                            : status === 'Late'
                            ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                            : status === 'On Leave'
                            ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                            : 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>

                {/* Remarks Input */}
                <div className="w-full md:w-48">
                  <input
                    type="text"
                    value={currentAtt.remarks}
                    onChange={e => handleRemarksChange(user.id, e.target.value)}
                    placeholder="Add remarks..."
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={() => setShowConfirmModal(true)}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/20 cursor-pointer"
          >
            Submit Attendance Records
          </button>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Confirm Attendance Submission</h3>
            <p className="text-xs text-slate-600">
              You are about to save attendance for <span className="font-bold">{activeSession?.title}</span>. Email notifications will be sent out to participants and attendance statistics will be generated.
            </p>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Review Records
              </button>
              <button
                onClick={handleSubmitAttendance}
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Confirm & Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
