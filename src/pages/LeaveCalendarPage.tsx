import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { LeaveRequest } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, User, Info } from 'lucide-react';

interface LeaveCalendarPageProps {
  onNavigate: (page: string) => void;
}

export const LeaveCalendarPage: React.FC<LeaveCalendarPageProps> = () => {
  const { currentUser } = useAuth();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 7, 1)); // August 2026 default
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);

  useEffect(() => {
    api.getLeaveRequests().then(data => setLeaves(data)).catch(console.error);
  }, []);

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Get leaves active on a particular day number
  const getLeavesForDay = (day: number) => {
    const checkDate = new Date(year, month, day).toISOString().split('T')[0];

    return leaves.filter(l => {
      if (l.status === 'Cancelled' || l.status === 'Rejected') return false;
      return checkDate >= l.startDate && checkDate <= l.endDate;
    });
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center">
            <CalendarIcon className="w-5 h-5 mr-2 text-indigo-600" />
            Corporate Leave Calendar
          </h1>
          <p className="text-xs text-slate-500">Visual monthly calendar view of team leave schedules</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={prevMonth}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold text-slate-900 min-w-[140px] text-center">
            {monthName}
          </span>
          <button
            onClick={nextMonth}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Days of week header */}
        <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 text-center text-xs font-bold text-slate-500 py-3">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 min-h-[500px]">
          {/* Blank cells for offset */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`blank-${i}`} className="bg-slate-50/40 p-2 min-h-[90px]" />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dayLeaves = getLeavesForDay(dayNum);
            const isToday =
              dayNum === 31 && month === 6 && year === 2026; // Simulated current date

            return (
              <div
                key={dayNum}
                className={`p-2 min-h-[90px] transition-colors relative ${
                  isToday ? 'bg-indigo-50/30 font-bold' : 'hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs ${
                      isToday
                        ? 'bg-indigo-600 text-white w-5 h-5 rounded-full flex items-center justify-center'
                        : 'text-slate-700'
                    }`}
                  >
                    {dayNum}
                  </span>
                  {dayLeaves.length > 0 && (
                    <span className="text-[10px] font-bold text-slate-400">
                      {dayLeaves.length} leave{dayLeaves.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                <div className="mt-1.5 space-y-1 max-h-[70px] overflow-y-auto">
                  {dayLeaves.map(l => (
                    <div
                      key={l.id}
                      onClick={() => setSelectedLeave(l)}
                      className={`text-[10px] p-1 rounded font-medium truncate cursor-pointer transition-transform hover:scale-[1.02] ${
                        l.leaveType === 'Medical Leave'
                          ? 'bg-rose-100 text-rose-800'
                          : l.leaveType === 'Annual Leave'
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                      title={`${l.userName} (${l.leaveType}): ${l.reason}`}
                    >
                      {l.userName} • {l.leaveType}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leave Detail Modal */}
      {selectedLeave && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Leave Request Details</h3>
              <StatusBadge status={selectedLeave.status} />
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Employee</span>
                <p className="font-bold text-slate-900">{selectedLeave.userName} ({selectedLeave.departmentName})</p>
              </div>

              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Leave Type</span>
                <p className="font-bold text-indigo-700">{selectedLeave.leaveType}</p>
              </div>

              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Dates & Duration</span>
                <p className="font-semibold text-slate-800">
                  {selectedLeave.startDate} to {selectedLeave.endDate} ({selectedLeave.totalDays} day - {selectedLeave.dayOption})
                </p>
              </div>

              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Reason</span>
                <p className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">{selectedLeave.reason}</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedLeave(null)}
                className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
