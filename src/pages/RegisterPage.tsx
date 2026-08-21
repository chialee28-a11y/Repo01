import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Department, UserRole } from '../types';
import { UserPlus, Building, Mail, User, Shield, CheckCircle2, ArrowLeft } from 'lucide-react';

interface RegisterPageProps {
  onNavigate: (page: string) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate }) => {
  const { register } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [googleId, setGoogleId] = useState('goog_' + Math.floor(10000 + Math.random() * 90000));
  const [departmentId, setDepartmentId] = useState('');
  const [role, setRole] = useState<UserRole>('Normal User');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getDepartments().then(depts => {
      setDepartments(depts);
      if (depts.length > 0) {
        setDepartmentId(depts[0].id);
      }
    }).catch(err => console.error(err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !departmentId) {
      setError('Please fill in all required fields');
      return;
    }

    const selectedDept = departments.find(d => d.id === departmentId);

    setError('');
    setLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        googleId,
        departmentId,
        departmentName: selectedDept?.name || 'Department',
        role,
        avatarUrl: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 1000000)}?w=150&auto=format&fit=crop&q=80`,
      });
      onNavigate('dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
        <div className="bg-gradient-to-r from-indigo-700 to-sky-600 p-6 sm:p-8 text-white relative">
          <button
            onClick={() => onNavigate('login')}
            className="absolute top-6 left-6 text-white/80 hover:text-white flex items-center text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Login
          </button>
          <div className="mt-6 text-center">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-3">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold">Register New Account</h1>
            <p className="text-xs text-indigo-100/80 mt-1">Connect your Google ID to LeavePlan & Attendance Hub</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Samuel Green"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Google Email Address *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="samuel.green@acmecorp.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Google ID (Simulated OAuth Token)</label>
            <input
              type="text"
              readOnly
              value={googleId}
              className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono text-slate-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Department *</label>
            <div className="relative">
              <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <select
                value={departmentId}
                onChange={e => setDepartmentId(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              >
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">System Role</label>
            <div className="relative">
              <Shield className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <select
                value={role}
                onChange={e => setRole(e.target.value as UserRole)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              >
                <option value="Normal User">Normal User (Submit leave, view schedules)</option>
                <option value="Super User">Super User (Take attendance, recommend follow-ups)</option>
                <option value="Admin">Admin (Full administrative control)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/25 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50 mt-4"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{loading ? 'Registering Account...' : 'Complete Google Registration'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
