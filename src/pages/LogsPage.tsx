import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { EmailLog, AuditLog } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Mail, Shield, Search, Eye, Calendar, User } from 'lucide-react';

export const LogsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'email' | 'audit'>('email');
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null);

  useEffect(() => {
    api.getEmailLogs().then(setEmailLogs).catch(console.error);
    api.getAuditLogs().then(setAuditLogs).catch(console.error);
  }, []);

  const filteredEmails = emailLogs.filter(
    e =>
      e.recipientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.eventType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAudits = auditLogs.filter(
    a =>
      a.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.performedByName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.entityType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">System Activity & Email Logs</h1>
          <p className="text-xs text-slate-500">Comprehensive compliance tracking, notification dispatches, and audit trail</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200/80">
          <button
            onClick={() => setActiveTab('email')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'email'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mail className="w-3.5 h-3.5 inline mr-1.5" />
            Sent Email Logs ({emailLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5 inline mr-1.5" />
            Audit Logs ({auditLogs.length})
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={
              activeTab === 'email'
                ? 'Search emails by recipient, subject, or event type...'
                : 'Search audit trail by action, performer, or entity...'
            }
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Content Table */}
      {activeTab === 'email' ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5">Timestamp</th>
                  <th className="px-5 py-3.5">Recipient</th>
                  <th className="px-5 py-3.5">Trigger Event</th>
                  <th className="px-5 py-3.5">Subject</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Preview</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmails.map(email => (
                  <tr key={email.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap text-slate-500">
                      {new Date(email.sentAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900">{email.recipientName}</div>
                      <div className="text-[10px] text-slate-400">{email.recipientEmail}</div>
                    </td>
                    <td className="px-5 py-4 font-mono text-[11px] text-indigo-700 font-semibold">
                      {email.eventType}
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-800 max-w-xs truncate">
                      {email.subject}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={email.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setSelectedEmail(email)}
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                        title="View Full Email Body"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5">Timestamp</th>
                  <th className="px-5 py-3.5">Action Performed</th>
                  <th className="px-5 py-3.5">Performed By</th>
                  <th className="px-5 py-3.5">Target Entity</th>
                  <th className="px-5 py-3.5">Audit Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAudits.map(audit => (
                  <tr key={audit.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap text-slate-500">
                      {new Date(audit.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded-md">
                        {audit.action}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-indigo-700">
                      {audit.performedByName}
                    </td>
                    <td className="px-5 py-4 font-mono text-[11px] text-slate-600">
                      {audit.entityType} ({audit.entityId})
                    </td>
                    <td className="px-5 py-4 text-slate-600 max-w-sm truncate" title={audit.remarks}>
                      {audit.remarks || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Email Body Modal */}
      {selectedEmail && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-[10px] font-bold text-indigo-600 uppercase">Dispatched Email Record</span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">{selectedEmail.subject}</h3>
              <p className="text-xs text-slate-500 mt-1">
                To: {selectedEmail.recipientName} ({selectedEmail.recipientEmail})
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed font-sans max-h-96 overflow-y-auto">
              {selectedEmail.body}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedEmail(null)}
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
