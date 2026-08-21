import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { LeaveType, LeaveDayType } from '../types';
import { Calendar, Clock, FileText, Paperclip, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

interface SubmitLeavePageProps {
  onNavigate: (page: string) => void;
}

export const SubmitLeavePage: React.FC<SubmitLeavePageProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();

  const [leaveType, setLeaveType] = useState<LeaveType>('Annual Leave');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [dayOption, setDayOption] = useState<LeaveDayType>('Full Day');
  const [reason, setReason] = useState('');
  const [attachmentName, setAttachmentName] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Calculate day count
  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) return 0;

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (dayOption !== 'Full Day') {
      return 0.5;
    }
    return diffDays;
  };

  const handleSubmit = async (isDraft: boolean) => {
    if (!currentUser) return;
    if (!startDate || !endDate) {
      setError('Start date and end date are required.');
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setError('End date cannot be earlier than start date.');
      return;
    }

    if (!reason.trim() && !isDraft) {
      setError('Please provide a reason for your leave request.');
      return;
    }

    const totalDays = calculateDays();
    if (totalDays <= 0) {
      setError('Invalid date selection.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.createLeaveRequest({
        userId: currentUser.id,
        userName: currentUser.name,
        userEmail: currentUser.email,
        departmentId: currentUser.departmentId,
        departmentName: currentUser.departmentName,
        leaveType,
        startDate,
        endDate,
        dayOption,
        totalDays,
        reason: reason.trim(),
        attachmentName: attachmentName || undefined,
        attachmentUrl: attachmentName ? 'https://example.com/attachments/' + attachmentName : undefined,
        status: isDraft ? 'Draft' : 'Submitted',
      });

      setSuccess(`Leave request successfully ${isDraft ? 'saved as Draft' : 'submitted'}!`);
      setTimeout(() => {
        onNavigate('leave-history');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to submit leave request.');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) return null;

  const totalDays = calculateDays();

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
          <h1 className="text-xl font-bold text-slate-900">Submit Leave Request</h1>
          <p className="text-xs text-slate-500">Apply for annual, medical, childcare or replacement leave</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
            {success}
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 text-rose-600 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Leave Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Leave Type *</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <select
                value={leaveType}
                onChange={e => setLeaveType(e.target.value as LeaveType)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              >
                <option value="Annual Leave">Annual Leave</option>
                <option value="Medical Leave">Medical Leave (MC Required)</option>
                <option value="Childcare Leave">Childcare Leave</option>
                <option value="Off-in-lieu">Off-in-lieu (Compensatory)</option>
                <option value="Others">Others (Compassionate / Unpaid)</option>
              </select>
            </div>
          </div>

          {/* Day Duration Option */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Day Option *</label>
            <div className="relative">
              <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <select
                value={dayOption}
                onChange={e => setDayOption(e.target.value as LeaveDayType)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              >
                <option value="Full Day">Full Day</option>
                <option value="Half Day (AM)">Half Day (Morning)</option>
                <option value="Half Day (PM)">Half Day (Afternoon)</option>
              </select>
            </div>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Start Date *</label>
            <input
              type="date"
              required
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">End Date *</label>
            <input
              type="date"
              required
              disabled={dayOption !== 'Full Day'}
              value={dayOption !== 'Full Day' ? startDate : endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white disabled:bg-slate-100 disabled:opacity-60"
            />
          </div>
        </div>

        {/* Total Calculated Days Indicator */}
        <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between">
          <span className="text-xs font-semibold text-indigo-900">Total Leave Duration Requested:</span>
          <span className="text-sm font-bold text-indigo-700 bg-white px-3 py-1 rounded-lg border border-indigo-200 shadow-sm">
            {totalDays} {totalDays === 1 ? 'Day' : 'Days'}
          </span>
        </div>

        {/* Reason / Remarks */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Reason or Remarks *</label>
          <div className="relative">
            <textarea
              rows={3}
              required
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Provide context or coverage details for your leave..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Optional Attachment */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Attachment (Medical Certificate or Document, Optional)
          </label>
          <div className="relative flex items-center space-x-2">
            <Paperclip className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={attachmentName}
              onChange={e => setAttachmentName(e.target.value)}
              placeholder="e.g. medical_certificate_aug5.pdf or image link"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Recommended for Medical Leave requests.</p>
        </div>

        {/* Submit Action Buttons */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={loading}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            Save as Draft
          </button>

          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={loading}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Leave Request'}
          </button>
        </div>
      </div>
    </div>
  );
};
