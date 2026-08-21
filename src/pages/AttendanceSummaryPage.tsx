import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AttendanceSummary } from '../types';
import { FileBarChart, AlertCircle, Sparkles, CheckCircle2, ArrowLeft, Users, Percent } from 'lucide-react';

interface AttendanceSummaryPageProps {
  onNavigate: (page: string, params?: any) => void;
  sessionId?: string;
}

export const AttendanceSummaryPage: React.FC<AttendanceSummaryPageProps> = ({ onNavigate, sessionId }) => {
  const [summaries, setSummaries] = useState<AttendanceSummary[]>([]);
  const [selectedSummary, setSelectedSummary] = useState<AttendanceSummary | null>(null);

  useEffect(() => {
    const loadSummaries = async () => {
      try {
        const sessions = await api.getBriefingSessions();
        const completed = sessions.filter(s => s.status === 'Completed');

        const list = await Promise.all(
          completed.map(s => api.getAttendanceSummary(s.id).catch(() => null))
        );

        const validSummaries = list.filter(Boolean) as AttendanceSummary[];
        setSummaries(validSummaries);

        if (sessionId) {
          const match = validSummaries.find(s => s.briefingSessionId === sessionId);
          if (match) setSelectedSummary(match);
          else if (validSummaries.length > 0) setSelectedSummary(validSummaries[0]);
        } else if (validSummaries.length > 0) {
          setSelectedSummary(validSummaries[0]);
        }
      } catch (err) {
        console.error(err);
      }
    };

    loadSummaries();
  }, [sessionId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <button
          onClick={() => onNavigate('dashboard')}
          className="p-2 bg-white rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Attendance Summaries & Insights</h1>
          <p className="text-xs text-slate-500">Briefing session participation metrics & follow-up recommendations</p>
        </div>
      </div>

      {summaries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
          No completed briefing attendance summaries recorded yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Session Selector List */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 space-y-2 h-fit">
            <h3 className="text-xs font-bold text-slate-500 uppercase px-2 mb-2">Completed Sessions</h3>
            {summaries.map(s => (
              <button
                key={s.briefingSessionId}
                onClick={() => setSelectedSummary(s)}
                className={`w-full p-3 rounded-xl border text-left transition-all ${
                  selectedSummary?.briefingSessionId === s.briefingSessionId
                    ? 'bg-indigo-50/80 border-indigo-200 text-indigo-900 shadow-sm'
                    : 'bg-slate-50 border-slate-100 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className="text-xs font-bold truncate">{s.briefingTitle}</div>
                <div className="text-[10px] text-slate-500 flex justify-between mt-1">
                  <span>{s.departmentName}</span>
                  <span className="font-bold">{s.attendancePercentage}% Attendance</span>
                </div>
              </button>
            ))}
          </div>

          {/* Right Selected Summary Details */}
          {selectedSummary && (
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                  {selectedSummary.departmentName}
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-0.5">{selectedSummary.briefingTitle}</h2>
                <p className="text-xs text-slate-500">
                  Date: {new Date(selectedSummary.dateTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </div>

              {/* KPI Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Total Users</span>
                  <p className="text-xl font-bold text-slate-900 mt-1">{selectedSummary.totalUsers}</p>
                </div>

                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase">Present</span>
                  <p className="text-xl font-bold text-emerald-800 mt-1">{selectedSummary.presentCount}</p>
                </div>

                <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
                  <span className="text-[10px] font-bold text-rose-600 uppercase">Absent</span>
                  <p className="text-xl font-bold text-rose-800 mt-1">{selectedSummary.absentCount}</p>
                </div>

                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <span className="text-[10px] font-bold text-amber-600 uppercase">Late</span>
                  <p className="text-xl font-bold text-amber-800 mt-1">{selectedSummary.lateCount}</p>
                </div>

                <div className="p-4 bg-sky-50 rounded-xl border border-sky-100">
                  <span className="text-[10px] font-bold text-sky-600 uppercase">On Leave</span>
                  <p className="text-xl font-bold text-sky-800 mt-1">{selectedSummary.onLeaveCount}</p>
                </div>

                <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                  <span className="text-[10px] font-bold text-indigo-600 uppercase">Attendance %</span>
                  <p className="text-xl font-bold text-indigo-800 mt-1">{selectedSummary.attendancePercentage}%</p>
                </div>
              </div>

              {/* Follow-up recommendation logic */}
              {selectedSummary.recommendFollowUp ? (
                <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl space-y-3">
                  <div className="flex items-center space-x-2 text-rose-900 font-bold text-xs">
                    <AlertCircle className="w-5 h-5 text-rose-600" />
                    <span>Follow-Up Briefing Recommended</span>
                  </div>
                  <p className="text-xs text-rose-700">{selectedSummary.recommendReason}</p>

                  <button
                    onClick={() => onNavigate('followup-scheduler', { sessionId: selectedSummary.briefingSessionId })}
                    className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-md inline-flex items-center"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Schedule Follow-up Briefing
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
                  Attendance threshold met ({selectedSummary.attendancePercentage}%). No follow-up needed.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
