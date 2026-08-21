import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { LeaveRequest, LeaveStatus } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Search, Filter, Edit, Trash2, Calendar, FileText, CheckCircle2, AlertTriangle, X } from 'lucide-react';

interface LeaveHistoryPageProps {
  onNavigate: (page: string) => void;
}

export const LeaveHistoryPage: React.FC<LeaveHistoryPageProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Cancel Confirmation Modal State
  const [cancelTarget, setCancelTarget] = useState<LeaveRequest | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Edit/Amend Modal State
  const [editTarget, setEditTarget] = useState<LeaveRequest | null>(null);
  const [editReason, setEditReason] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');

  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');

  const loadLeaves = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      // Super user/admin can see department/all, normal user sees own
      const filters = currentUser.role === 'Normal User' ? { userId: currentUser.id } : {};
      const data = await api.getLeaveRequests(filters);
      setLeaves(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaves();
  }, [currentUser]);

  const handleConfirmCancel = async () => {
    if (!cancelTarget || !currentUser) return;
    try {
      await api.updateLeaveRequest(
        cancelTarget.id,
        { status: 'Cancelled', reason: cancelTarget.reason + ` (Cancelled: ${cancelReason || 'User requested'})` },
        { id: currentUser.id, name: currentUser.name, email: currentUser.email }
      );
      setActionMessage('Leave request cancelled successfully.');
      setCancelTarget(null);
      setCancelReason('');
      loadLeaves();
    } catch (err: any) {
      setActionError(err.message || 'Failed to cancel leave.');
    }
  };

  const handleSaveAmendment = async () => {
    if (!editTarget || !currentUser) return;
    try {
      await api.updateLeaveRequest(
        editTarget.id,
        {
          startDate: editStartDate,
          endDate: editEndDate,
          reason: editReason,
          status: editTarget.status === 'Draft' ? 'Submitted' : editTarget.status,
        },
        { id: currentUser.id, name: currentUser.name, email: currentUser.email }
      );
      setActionMessage('Leave request amended successfully.');
      setEditTarget(null);
      loadLeaves();
    } catch (err: any) {
      setActionError(err.message || 'Failed to amend leave request.');
    }
  };

  const filteredLeaves = leaves.filter(l => {
    const matchesSearch =
      l.leaveType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.userName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All' || l.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Leave History Records</h1>
          <p className="text-xs text-slate-500">View, amend, or cancel your submitted leave applications</p>
        </div>

        <button
          onClick={() => onNavigate('submit-leave')}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
        >
          <Calendar className="w-4 h-4 mr-2" />
          Submit New Leave
        </button>
      </div>

      {actionMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage('')} className="text-emerald-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError('')} className="text-rose-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by leave type, reason, or employee..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Leave History Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="px-5 py-3.5">Employee & Dept</th>
                <th className="px-5 py-3.5">Leave Type</th>
                <th className="px-5 py-3.5">Start & End Dates</th>
                <th className="px-5 py-3.5">Duration</th>
                <th className="px-5 py-3.5">Reason</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    No leave history records match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredLeaves.map(leave => {
                  const isOwner = currentUser?.id === leave.userId;
                  const isFuture = new Date(leave.startDate) >= new Date();
                  const canCancel = isOwner && isFuture && leave.status !== 'Cancelled';
                  const canAmend = isOwner && (leave.status === 'Submitted' || leave.status === 'Draft' || isFuture);

                  return (
                    <tr key={leave.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900">{leave.userName}</div>
                        <div className="text-[10px] text-slate-400">{leave.departmentName}</div>
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-800">{leave.leaveType}</td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div>{leave.startDate} to {leave.endDate}</div>
                        <div className="text-[10px] text-slate-400">{leave.dayOption}</div>
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-900">{leave.totalDays} day(s)</td>
                      <td className="px-5 py-4 max-w-xs truncate" title={leave.reason}>
                        {leave.reason}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={leave.status} />
                      </td>
                      <td className="px-5 py-4 text-right space-x-1">
                        {canAmend && (
                          <button
                            onClick={() => {
                              setEditTarget(leave);
                              setEditStartDate(leave.startDate);
                              setEditEndDate(leave.endDate);
                              setEditReason(leave.reason);
                            }}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Amend Leave Request"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}

                        {canCancel && (
                          <button
                            onClick={() => setCancelTarget(leave)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Cancel Future Leave"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {cancelTarget && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-3 bg-rose-50 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Confirm Leave Cancellation</h3>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to cancel your <span className="font-bold">{cancelTarget.leaveType}</span> request for{' '}
              <span className="font-bold">{cancelTarget.startDate} to {cancelTarget.endDate}</span>?
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cancellation Reason (Optional)
              </label>
              <textarea
                rows={2}
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="Reason for cancelling this leave request..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setCancelTarget(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Keep Leave
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-md"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Amend Leave Modal */}
      {editTarget && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Amend Leave Request</h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                value={editStartDate}
                onChange={e => setEditStartDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
              <input
                type="date"
                value={editEndDate}
                onChange={e => setEditEndDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Updated Reason</label>
              <textarea
                rows={2}
                value={editReason}
                onChange={e => setEditReason(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setEditTarget(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAmendment}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
