import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { BriefingSession, Department } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Presentation, Plus, Calendar, MapPin, Video, CheckSquare, Sparkles, X, CheckCircle2 } from 'lucide-react';

interface BriefingSessionsPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const BriefingSessionsPage: React.FC<BriefingSessionsPageProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const [sessions, setSessions] = useState<BriefingSession[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New session form
  const [title, setTitle] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [dateTime, setDateTime] = useState('2026-08-05T09:30');
  const [location, setLocation] = useState('Conference Room 3A');
  const [isOnline, setIsOnline] = useState(true);
  const [meetingLink, setMeetingLink] = useState('https://meet.google.com/abc-defg-hij');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isSuperUser = currentUser?.role === 'Super User' || currentUser?.role === 'Admin';

  const loadData = async () => {
    try {
      const [sessionsData, deptsData] = await Promise.all([
        api.getBriefingSessions(),
        api.getDepartments(),
      ]);
      setSessions(sessionsData);
      setDepartments(deptsData);
      if (deptsData.length > 0 && !departmentId) {
        setDepartmentId(deptsData[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!title.trim() || !departmentId || !dateTime) {
      setError('Title, department, and date/time are required.');
      return;
    }

    const dept = departments.find(d => d.id === departmentId);

    setLoading(true);
    setError('');
    try {
      await api.createBriefingSession({
        title: title.trim(),
        departmentId,
        departmentName: dept?.name || 'Department',
        dateTime,
        location: location.trim(),
        isOnline,
        meetingLink: isOnline ? meetingLink.trim() : undefined,
        createdByUserId: currentUser.id,
        createdByName: currentUser.name,
        status: 'Planned',
        notes: notes.trim() || undefined,
      });

      setSuccess('Briefing session scheduled and notifications sent to department users!');
      setTimeout(() => {
        setShowCreateModal(false);
        setSuccess('');
        loadData();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to create briefing session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Department Briefing Sessions</h1>
          <p className="text-xs text-slate-500">Scheduled briefing sessions, location details, and attendance tracking</p>
        </div>

        {isSuperUser && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Briefing Session
          </button>
        )}
      </div>

      {/* Briefings List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sessions.map(s => (
          <div
            key={s.id}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                    {s.departmentName}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">{s.title}</h3>
                </div>
                <StatusBadge status={s.status} />
              </div>

              <div className="space-y-1 text-xs text-slate-600 pt-1">
                <div className="flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-2 text-slate-400" />
                  {new Date(s.dateTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </div>

                <div className="flex items-center">
                  <MapPin className="w-3.5 h-3.5 mr-2 text-slate-400" />
                  {s.location}
                </div>

                {s.isOnline && s.meetingLink && (
                  <div className="flex items-center text-indigo-600 font-medium">
                    <Video className="w-3.5 h-3.5 mr-2 text-indigo-500" />
                    <a href={s.meetingLink} target="_blank" rel="noreferrer" className="hover:underline truncate">
                      {s.meetingLink}
                    </a>
                  </div>
                )}
              </div>

              {s.notes && (
                <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  "{s.notes}"
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[10px] text-slate-400">Created by {s.createdByName}</span>

              <div className="flex items-center space-x-2">
                {isSuperUser && (
                  <button
                    onClick={() => onNavigate('take-attendance', { sessionId: s.id })}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs shadow-sm inline-flex items-center"
                  >
                    <CheckSquare className="w-3.5 h-3.5 mr-1" />
                    {s.status === 'Completed' ? 'View/Update Attendance' : 'Take Attendance'}
                  </button>
                )}

                {s.status === 'Completed' && (
                  <button
                    onClick={() => onNavigate('attendance-summary', { sessionId: s.id })}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs"
                  >
                    View Summary
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Briefing Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Create New Briefing Session</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
                {success}
              </div>
            )}

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateSession} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Briefing Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Q3 Security & Compliance Briefing"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Department *</label>
                <select
                  value={departmentId}
                  onChange={e => setDepartmentId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date and Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={dateTime}
                  onChange={e => setDateTime(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Location / Venue</label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="e.g. Main Auditorium / Conference Room 3B"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="isOnlineCheck"
                  checked={isOnline}
                  onChange={e => setIsOnline(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isOnlineCheck" className="text-xs font-semibold text-slate-700">
                  Include Online Meeting Link
                </label>
              </div>

              {isOnline && (
                <div>
                  <input
                    type="url"
                    value={meetingLink}
                    onChange={e => setMeetingLink(e.target.value)}
                    placeholder="https://meet.google.com/..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Session Agenda / Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Mandatory briefing on company policies..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Schedule & Notify'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
