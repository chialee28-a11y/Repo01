import React from 'react';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { User, Mail, Shield, Building, Calendar, Key, Clock, CheckCircle2, Building2 } from 'lucide-react';

interface UserProfilePageProps {
  onNavigate: (page: string) => void;
}

export const UserProfilePage: React.FC<UserProfilePageProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();

  if (!currentUser) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-indigo-700 via-indigo-600 to-sky-600 relative" />
        <div className="px-6 pb-6 relative flex flex-col sm:flex-row sm:items-end justify-between -mt-12 gap-4">
          <div className="flex items-end space-x-4">
            <img
              src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'}
              alt={currentUser.name}
              className="w-24 h-24 rounded-2xl object-cover ring-4 ring-white shadow-md bg-white"
            />
            <div className="pb-1">
              <h1 className="text-xl font-bold text-slate-900">{currentUser.name}</h1>
              <p className="text-xs text-slate-500">{currentUser.email}</p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('change-department')}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Building2 className="w-4 h-4 mr-2" />
            Change Department
          </button>
        </div>
      </div>

      {/* Detailed Fields */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
          Employee Profile Details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
              <Key className="w-3.5 h-3.5 mr-1 text-slate-400" /> User System ID
            </span>
            <p className="text-xs font-mono font-bold text-slate-900">{currentUser.id}</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
              <User className="w-3.5 h-3.5 mr-1 text-slate-400" /> Full Name
            </span>
            <p className="text-xs font-semibold text-slate-900">{currentUser.name}</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
              <Mail className="w-3.5 h-3.5 mr-1 text-slate-400" /> Google Email
            </span>
            <p className="text-xs font-semibold text-slate-900">{currentUser.email}</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
              <Key className="w-3.5 h-3.5 mr-1 text-slate-400" /> Google ID
            </span>
            <p className="text-xs font-mono font-semibold text-slate-900">{currentUser.googleId}</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
              <Building className="w-3.5 h-3.5 mr-1 text-slate-400" /> Current Department
            </span>
            <p className="text-xs font-bold text-indigo-700">{currentUser.departmentName}</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
              <Shield className="w-3.5 h-3.5 mr-1 text-slate-400" /> System Role
            </span>
            <div className="pt-0.5">
              <StatusBadge status={currentUser.role} size="sm" />
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-slate-400" /> Account Status
            </span>
            <div className="pt-0.5">
              <StatusBadge status={currentUser.status} size="sm" />
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" /> Account Created Date
            </span>
            <p className="text-xs font-medium text-slate-800">
              {new Date(currentUser.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1 sm:col-span-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" /> Last Login Timestamp
            </span>
            <p className="text-xs font-medium text-slate-800">
              {new Date(currentUser.lastLoginAt).toLocaleString([], { dateStyle: 'full', timeStyle: 'medium' })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
