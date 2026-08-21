import React from 'react';
import { LeaveStatus, AttendanceStatus, BriefingStatus, UserRole } from '../types';

interface StatusBadgeProps {
  status: LeaveStatus | AttendanceStatus | BriefingStatus | UserRole | string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs font-medium',
    md: 'px-2.5 py-1 text-xs font-semibold',
    lg: 'px-3 py-1.5 text-sm font-semibold',
  }[size];

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';

  switch (status) {
    // Leave Status
    case 'Approved':
    case 'Completed':
    case 'Present':
    case 'Active':
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
      break;
    case 'Submitted':
    case 'Planned':
    case 'Late':
      colorClasses = 'bg-amber-50 text-amber-700 border-amber-200/80';
      break;
    case 'On Leave':
      colorClasses = 'bg-sky-50 text-sky-700 border-sky-200/80';
      break;
    case 'Rejected':
    case 'Absent':
    case 'Cancelled':
    case 'Inactive':
      colorClasses = 'bg-rose-50 text-rose-700 border-rose-200/80';
      break;
    case 'Excused':
      colorClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200/80';
      break;
    case 'Draft':
      colorClasses = 'bg-slate-100 text-slate-600 border-slate-200';
      break;
    // Roles
    case 'Admin':
      colorClasses = 'bg-purple-50 text-purple-700 border-purple-200/80';
      break;
    case 'Super User':
      colorClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200/80';
      break;
    case 'Normal User':
      colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
      break;
  }

  return (
    <span className={`inline-flex items-center rounded-md border ${sizeClasses} ${colorClasses}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      {status}
    </span>
  );
};
