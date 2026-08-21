import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Department } from '../types';
import { Building2, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface ChangeDepartmentPageProps {
  onNavigate: (page: string) => void;
}

export const ChangeDepartmentPage: React.FC<ChangeDepartmentPageProps> = ({ onNavigate }) => {
  const { currentUser, updateCurrentUser } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.getDepartments().then(depts => {
      setDepartments(depts);
      if (currentUser) {
        setSelectedDeptId(currentUser.departmentId);
      }
    });
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeptId) return;

    const dept = departments.find(d => d.id === selectedDeptId);
    if (!dept) return;

    if (dept.id === currentUser?.departmentId) {
      setError('You are already assigned to this department');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await updateCurrentUser({
        departmentId: dept.id,
        departmentName: dept.name,
      });

      setSuccess(`Successfully changed department to ${dept.name}`);
      setTimeout(() => {
        onNavigate('profile');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to update department');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-3">
        <button
          onClick={() => onNavigate('profile')}
          className="p-2 bg-white rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Change Department</h1>
          <p className="text-xs text-slate-500">
            Transfer your employee profile to a new corporate department
          </p>
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
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Current Assigned Department
            </span>
            <p className="text-sm font-bold text-slate-900 mt-0.5">{currentUser.departmentName}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select New Department *
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <select
                value={selectedDeptId}
                onChange={e => setSelectedDeptId(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              >
                {departments.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Reason / Transfer Remarks (Optional)
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="e.g. Internal department transfer approved by HR manager"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => onNavigate('profile')}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Confirm Department Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
