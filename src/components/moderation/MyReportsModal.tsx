import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldAlert,
  Scale,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../lib/api';
import { ContentReport, CopyrightReport } from '../../types';

interface MyReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MyReportsModal: React.FC<MyReportsModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { isDark } = useTheme();

  const [activeTab, setActiveTab] = useState<'community' | 'copyright'>('community');
  const [loading, setLoading] = useState(false);
  const [communityReports, setCommunityReports] = useState<ContentReport[]>([]);
  const [copyrightReports, setCopyrightReports] = useState<CopyrightReport[]>([]);

  const fetchReports = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.getMyReports(user.id, user.email);
      if (res && res.success) {
        setCommunityReports(res.reports || []);
        setCopyrightReports(res.copyrightReports || []);
      }
    } catch (err) {
      console.error('Failed to load reports', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchReports();
    }
  }, [isOpen, user?.id]);

  if (!isOpen) return null;

  const renderStatusBadge = (status: string) => {
    const s = (status || 'SUBMITTED').toUpperCase();
    switch (s) {
      case 'SUBMITTED':
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3" /> Under Review
          </span>
        );
      case 'UNDER_REVIEW':
      case 'INVESTIGATING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Clock className="w-3 h-3" /> Investigating
          </span>
        );
      case 'RESOLVED':
      case 'ACTION_TAKEN':
      case 'TAKEDOWN_EXECUTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="w-3 h-3" /> Action Taken
          </span>
        );
      case 'DISMISSED':
      case 'REJECTED':
      case 'COUNTER_NOTICE_RECEIVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            <AlertCircle className="w-3 h-3" /> Closed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            {status}
          </span>
        );
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className={`relative w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-['Syne',sans-serif]">My Submitted Reports & Claims</h2>
              <p className="text-xs text-slate-400">Track the review status of reports you have submitted</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchReports}
              disabled={loading}
              className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition disabled:opacity-50"
              title="Refresh"
              aria-label="Refresh reports"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="p-4 pb-0 shrink-0">
          <div className="flex rounded-2xl bg-slate-800/60 p-1 border border-slate-700/50">
            <button
              type="button"
              onClick={() => setActiveTab('community')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'community' ? 'bg-[#1455D9] text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Community Reports ({communityReports.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('copyright')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'copyright' ? 'bg-[#1455D9] text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Copyright Claims ({copyrightReports.length})</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {loading ? (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
              <p className="text-xs">Loading reports...</p>
            </div>
          ) : activeTab === 'community' ? (
            communityReports.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <ShieldAlert className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-sm font-semibold text-slate-300">No community reports submitted</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  When you report inappropriate tracks, albums, or behavior, you will see the moderation status here.
                </p>
              </div>
            ) : (
              communityReports.map((report) => (
                <div
                  key={report.id}
                  className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-700 text-slate-300">
                          {report.targetType}
                        </span>
                        <h4 className="text-xs font-bold text-white">{report.targetTitle || report.targetId}</h4>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Reason: <span className="text-slate-200 font-medium">{report.reason.replace(/_/g, ' ')}</span>
                      </p>
                    </div>
                    <div>{renderStatusBadge(report.status)}</div>
                  </div>

                  {report.description && (
                    <p className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                      "{report.description}"
                    </p>
                  )}

                  {report.moderationNotes && (
                    <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-xs text-indigo-200">
                      <span className="font-semibold text-indigo-300 block text-[11px]">Moderator note:</span>
                      {report.moderationNotes}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800">
                    <span>Ref ID: {report.id}</span>
                    <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )
          ) : copyrightReports.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Scale className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">No copyright claims filed</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Official DMCA/Copyright takedown requests submitted by you will be listed here with resolution notes.
              </p>
            </div>
          ) : (
            copyrightReports.map((claim) => (
              <div
                key={claim.id}
                className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-900/60 text-indigo-300 border border-indigo-500/30">
                        {claim.targetType}
                      </span>
                      <h4 className="text-xs font-bold text-white">{claim.targetTitle || claim.targetId}</h4>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Original Work: <span className="text-slate-200 font-medium">{claim.originalWorkTitle}</span>
                    </p>
                  </div>
                  <div>{renderStatusBadge(claim.status)}</div>
                </div>

                {claim.infringementDescription && (
                  <p className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                    "{claim.infringementDescription}"
                  </p>
                )}

                {claim.moderationNotes && (
                  <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-xs text-indigo-200">
                    <span className="font-semibold text-indigo-300 block text-[11px]">Legal review note:</span>
                    {claim.moderationNotes}
                  </div>
                )}

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800">
                  <span>Ref ID: {claim.id}</span>
                  <span>{new Date(claim.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
