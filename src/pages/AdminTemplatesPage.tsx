import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { NotificationTemplate } from '../types';
import { Mail, Edit, Eye, CheckCircle2, Info } from 'lucide-react';

export const AdminTemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);

  const [subjectTemplate, setSubjectTemplate] = useState('');
  const [bodyTemplate, setBodyTemplate] = useState('');

  const [showPreview, setShowPreview] = useState(false);
  const [message, setMessage] = useState('');

  const loadTemplates = async () => {
    try {
      const list = await api.getNotificationTemplates();
      setTemplates(list);
      if (list.length > 0 && !selectedTemplate) {
        setSelectedTemplate(list[0]);
        setSubjectTemplate(list[0].subjectTemplate);
        setBodyTemplate(list[0].bodyTemplate);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleSelectTemplate = (t: NotificationTemplate) => {
    setSelectedTemplate(t);
    setSubjectTemplate(t.subjectTemplate);
    setBodyTemplate(t.bodyTemplate);
    setMessage('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;

    try {
      await api.updateNotificationTemplate(selectedTemplate.id, {
        subjectTemplate,
        bodyTemplate,
      });
      setMessage('Template updated successfully');
      loadTemplates();
    } catch (err) {
      console.error(err);
    }
  };

  const renderPreviewSubject = () => {
    return subjectTemplate
      .replace(/{recipient_name}/g, 'Alex Rivera')
      .replace(/{department}/g, 'Engineering & IT')
      .replace(/{details}/g, 'Annual Leave Request (3 Days)')
      .replace(/{date_time}/g, 'Aug 4, 2026')
      .replace(/{action_url}/g, 'https://ais-dev.run.app/leave-history');
  };

  const renderPreviewBody = () => {
    return bodyTemplate
      .replace(/{recipient_name}/g, 'Alex Rivera')
      .replace(/{department}/g, 'Engineering & IT')
      .replace(/{details}/g, 'Annual Leave Request (3 Days)')
      .replace(/{date_time}/g, 'Aug 4, 2026')
      .replace(/{action_url}/g, 'https://ais-dev.run.app/leave-history');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Notification Template Settings</h1>
        <p className="text-xs text-slate-500">
          Configure email subjects, notification triggers, and dynamic variable placeholders
        </p>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center">
          <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
          {message}
        </div>
      )}

      {/* Helper Box */}
      <div className="bg-indigo-50/60 rounded-2xl border border-indigo-100 p-4 text-xs text-indigo-900 space-y-1">
        <span className="font-bold flex items-center">
          <Info className="w-4 h-4 mr-1.5 text-indigo-600" /> Supported Dynamic Template Variables:
        </span>
        <p className="text-indigo-800/80 font-mono text-[11px]">
          &#123;recipient_name&#125; • &#123;department&#125; • &#123;details&#125; • &#123;date_time&#125; • &#123;action_url&#125;
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Templates List */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 space-y-2 h-fit">
          <h3 className="text-xs font-bold text-slate-500 uppercase px-2 mb-2">Event Trigger Templates</h3>
          {templates.map(t => (
            <button
              key={t.id}
              onClick={() => handleSelectTemplate(t)}
              className={`w-full p-3 rounded-xl border text-left transition-all ${
                selectedTemplate?.id === t.id
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-900 shadow-sm'
                  : 'bg-slate-50 border-slate-100 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <div className="text-xs font-bold">{t.name}</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">Event: {t.eventType}</div>
            </button>
          ))}
        </div>

        {/* Template Editor */}
        {selectedTemplate && (
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">{selectedTemplate.name}</h2>
                <span className="text-[10px] font-mono text-slate-400">Trigger ID: {selectedTemplate.eventType}</span>
              </div>

              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold inline-flex items-center"
              >
                <Eye className="w-3.5 h-3.5 mr-1" />
                {showPreview ? 'Hide Preview' : 'Live Sample Preview'}
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Line Template</label>
                <input
                  type="text"
                  required
                  value={subjectTemplate}
                  onChange={e => setSubjectTemplate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Body Template</label>
                <textarea
                  rows={8}
                  required
                  value={bodyTemplate}
                  onChange={e => setBodyTemplate(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 leading-relaxed"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md"
                >
                  Save Template Changes
                </button>
              </div>
            </form>

            {/* Live Preview Box */}
            {showPreview && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 mt-4">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                  Formatted Sample Output
                </span>

                <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                  <div className="font-bold text-slate-900 border-b border-slate-100 pb-2">
                    Subject: {renderPreviewSubject()}
                  </div>
                  <div className="whitespace-pre-wrap text-slate-700 font-sans leading-relaxed">
                    {renderPreviewBody()}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
