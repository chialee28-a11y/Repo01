import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { BriefingSession, Department } from '../types';
import { Sparkles, Calendar, CheckCircle2, ArrowLeft, Users, AlertTriangle, Send } from 'lucide-react';

interface FollowUpSchedulerPageProps {
  onNavigate: (page: string) => void;
  sessionId?: string;
}

export const FollowUpSchedulerPage: React.FC<FollowUpSchedulerPageProps> = ({ onNavigate, sessionId }) => {
  const { currentUser } = useAuth();
  const [sessions, setSessions] = useState<BriefingSession[]>([]);
  const [parentSession, setParentSession] = useState<BriefingSession | null>(null);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentId, setDepartmentId] = useState('');

  // Recommendation engine state
  const [suggestion, setSuggestion] = useState<{
    suggestedDate: string;
    onLeaveCount: number;
    availableUsers: number;
    totalUsers: number;
  } | null>(null);

  const [title, setTitle] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [location, setLocation] = useState('Conference Room 3A & Online');
  const [meetingLink, setMeetingLink] = useState('https://meet.google.com/followup-briefing-2026');
  const [notes, setNotes] = useState('Follow-up briefing for missed participants.');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const initData = async () => {
      try {
        const [allSessions, depts] = await Promise.all([
          api.getBriefingSessions(),
          api.getDepartments(),
        ]);
        setSessions(allSessions);
        setDepartments(depts);

        let targetSession = allSessions.find(s => s.id === sessionId);
        if (!targetSession && allSessions.length > 0) targetSession = allSessions[0];

        if (targetSession) {
          setParentSession(targetSession);
          setDepartmentId(targetSession.departmentId);
          setTitle(`Follow-up: ${targetSession.title}`);

          // Fetch smart date recommendation
          const rec = await api.suggestNextBriefingDate(targetSession.departmentId);
          setSuggestion(rec);
          setDateTime(rec.suggestedDate.slice(0, 16));
        } else if (depts.length > 0) {
          setDepartmentId(depts[0].id);
          const rec = await api.suggestNextBriefingDate(depts[0].id);
          setSuggestion(rec);
          setDateTime(rec.suggestedDate.slice(0, 16));
        }
      } catch (err) {
        console.error(err);
      }
    };

    initData();
  }, [sessionId]);

  const handleDeptChange = async (deptId: string) => {
    setDepartmentId(deptId);
    try {
      const rec = await api.suggestNextBriefingDate(deptId);
      setSuggestion(rec);
      setDateTime(rec.suggestedDate.slice(0, 16));
    } catch (err) {
      console.error(err);
    }
  };

  const handleScheduleFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const dept = departments.find(d => d.id === departmentId);

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.createBriefingSession({
        title,
        departmentId,
        departmentName: dept?.name || 'Department',
        dateTime,
        location,
        isOnline: true,
        meetingLink,
        createdByUserId: currentUser.id,
        createdByName: currentUser.name,
        status: 'Planned',
        isFollowUp: true,
        parentBriefingId: parentSession?.id,
        notes,
      });

      setSuccess('Follow-up briefing scheduled successfully! Email notifications sent to department users.');
      setTimeout(() => {
        onNavigate('briefings');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to schedule follow-up briefing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center space-x-3">
        <button
          onClick={() => onNavigate('dashboard')}
          className="p-2 bg-white rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-indigo-600" />
            Smart Follow-Up Briefing Scheduler
          </h1>
          <p className="text-xs text-slate-500">
            Automatically avoids user leave collisions to maximize attendance
          </p>
        </div>
      </div>

      {/* Recommendation Banner */}
      {suggestion && (
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg space-y-3">
          <div className="flex items-center space-x-2 text-indigo-300 font-bold text-xs">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>AI Leave Plan Optimization Result</span>
          </div>

          <h3 className="text-base font-bold">
            Recommended Date: {new Date(suggestion.suggestedDate).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </h3>

          <div className="grid grid-cols-3 gap-3 pt-1 text-xs">
            <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
              <span className="text-[10px] text-indigo-200">Total Dept Users</span>
              <p className="font-bold text-white">{suggestion.totalUsers}</p>
            </div>
            <div className="bg-emerald-500/20 p-2.5 rounded-xl border border-emerald-500/30">
              <span className="text-[10px] text-emerald-200">Available Employees</span>
              <p className="font-bold text-emerald-300">{suggestion.availableUsers}</p>
            </div>
            <div className="bg-amber-500/20 p-2.5 rounded-xl border border-amber-500/30">
              <span className="text-[10px] text-amber-200">On Approved Leave</span>
              <p className="font-bold text-amber-300">{suggestion.onLeaveCount}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
            {success}
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleScheduleFollowUp} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Department</label>
            <select
              value={departmentId}
              onChange={e => handleDeptChange(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
            >
              {departments.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Briefing Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Optimized Date & Time *
            </label>
            <input
              type="datetime-local"
              required
              value={dateTime}
              onChange={e => setDateTime(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-indigo-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Location / Venue</label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Online Meeting Link</label>
            <input
              type="url"
              value={meetingLink}
              onChange={e => setMeetingLink(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Instructions</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="px-4 py-2.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/20 flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? 'Scheduling...' : 'Schedule Follow-up & Notify All'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
