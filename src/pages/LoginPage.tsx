import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { LogIn, UserCheck, ShieldCheck, Mail, ArrowRight, Sparkles } from 'lucide-react';

interface LoginPageProps {
  onNavigate: (page: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login, loginWithUser } = useAuth();
  const [emailInput, setEmailInput] = useState('');
  const [googleIdInput, setGoogleIdInput] = useState('goog_' + Math.floor(1000 + Math.random() * 9000));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Quick Demo User Quick Switcher
  const handleQuickLogin = async (email: string) => {
    setError('');
    setLoading(true);
    try {
      await login(email);
      onNavigate('dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setError('Please enter a Google account email');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(emailInput.trim());
      onNavigate('dashboard');
    } catch (err: any) {
      setError(err.message || 'User not found. Please register your account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
        {/* Header banner */}
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-sky-600 p-8 text-white text-center relative">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mb-4 shadow-inner">
            <UserCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">LeavePlan & Attendance Hub</h1>
          <p className="mt-1 text-xs text-indigo-100/80 font-medium">
            Corporate Employee Leave & Briefing System
          </p>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center">
              <span className="w-2 h-2 rounded-full bg-rose-500 mr-2 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Google Auth Form */}
          <form onSubmit={handleCustomGoogleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Google Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  placeholder="name@acmecorp.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/25 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Authenticating...' : 'Sign In with Google Account'}</span>
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-semibold tracking-wider text-[10px]">
                Or Instant Demo Sign-In
              </span>
            </div>
          </div>

          {/* Quick Demo Role Accounts */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-slate-500 mb-2">Select a pre-configured account:</p>
            
            <button
              onClick={() => handleQuickLogin('david.chen@acmecorp.com')}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50 text-left transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
                  alt="David Chen"
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    David Chen
                  </div>
                  <div className="text-[10px] text-slate-500">Super User • Engineering & IT</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => handleQuickLogin('sarah.jenkins@acmecorp.com')}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-purple-100 bg-purple-50/50 hover:bg-purple-50 text-left transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80"
                  alt="Sarah Jenkins"
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                    Sarah Jenkins
                  </div>
                  <div className="text-[10px] text-slate-500">Admin • Human Resources</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => handleQuickLogin('alex.rivera@acmecorp.com')}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <img
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80"
                  alt="Alex Rivera"
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-slate-700 transition-colors">
                    Alex Rivera
                  </div>
                  <div className="text-[10px] text-slate-500">Normal User • Engineering & IT</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              New employee?{' '}
              <button
                onClick={() => onNavigate('register')}
                className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                Register Account with Google ID
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
