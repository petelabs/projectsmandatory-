import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  ShieldAlert,
  AlertTriangle,
  Search,
  Filter,
  CheckCircle,
  Clock,
  UserX,
  EyeOff,
  History,
  Info,
  RefreshCw,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import {
  SecurityFlagRecord,
  SecuritySeverity,
  ModerationAuditLog,
} from '../../types';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext';

interface AdminSecurityTabProps {
  token?: string;
  adminEmail?: string;
}

export const AdminSecurityTab: React.FC<AdminSecurityTabProps> = ({
  token,
  adminEmail,
}) => {
  const { showToast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState<'flags' | 'audit'>('flags');

  // Security Flags State
  const [flags, setFlags] = useState<SecurityFlagRecord[]>([]);
  const [isLoadingFlags, setIsLoadingFlags] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<'ALL' | SecuritySeverity>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED'>('ALL');
  const [flagSearch, setFlagSearch] = useState('');

  // Flag Resolution Modal
  const [selectedFlag, setSelectedFlag] = useState<SecurityFlagRecord | null>(null);
  const [resolutionStatus, setResolutionStatus] = useState<'RESOLVED' | 'INVESTIGATING' | 'DISMISSED'>('RESOLVED');
  const [adminNotes, setAdminNotes] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<ModerationAuditLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [auditActionFilter, setAuditActionFilter] = useState<string>('ALL');
  const [auditSearch, setAuditSearch] = useState('');

  const fetchSecurityFlags = async () => {
    setIsLoadingFlags(true);
    try {
      const res = await api.adminGetSecurityFlags(token, {
        severity: severityFilter !== 'ALL' ? severityFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      });
      if (res.success && res.flags) {
        setFlags(res.flags);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load security flags', 'error');
    } finally {
      setIsLoadingFlags(false);
    }
  };

  const fetchAuditLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await api.adminGetAuditLogs(token, {
        action: auditActionFilter !== 'ALL' ? auditActionFilter : undefined,
        search: auditSearch || undefined,
      });
      if (res.success && res.logs) {
        setAuditLogs(res.logs);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load audit logs', 'error');
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchSecurityFlags();
  }, [severityFilter, statusFilter]);

  useEffect(() => {
    if (activeSubTab === 'audit') {
      fetchAuditLogs();
    }
  }, [activeSubTab, auditActionFilter]);

  const handleOpenResolveFlag = (flag: SecurityFlagRecord) => {
    setSelectedFlag(flag);
    setResolutionStatus(flag.status === 'OPEN' ? 'RESOLVED' : (flag.status as any));
    setAdminNotes(flag.adminNotes || '');
  };

  const handleCloseResolveModal = () => {
    setSelectedFlag(null);
    setAdminNotes('');
  };

  const handleSaveResolution = async () => {
    if (!selectedFlag) return;
    setIsResolving(true);
    try {
      const res = await api.adminResolveSecurityFlag(token, selectedFlag.id, {
        status: resolutionStatus,
        adminNotes,
        adminEmail: adminEmail || 'Admin',
      });

      if (res.success) {
        showToast(`Security flag ${selectedFlag.id} updated`, 'success');
        setFlags((prev) =>
          prev.map((f) =>
            f.id === selectedFlag.id
              ? {
                  ...f,
                  status: resolutionStatus,
                  adminNotes,
                  updatedAt: new Date().toISOString(),
                }
              : f
          )
        );
        handleCloseResolveModal();
      } else {
        throw new Error(res.error || 'Failed to update flag');
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating security flag', 'error');
    } finally {
      setIsResolving(false);
    }
  };

  const filteredFlags = useMemo(() => {
    if (!flagSearch.trim()) return flags;
    const q = flagSearch.toLowerCase();
    return flags.filter(
      (f) =>
        f.targetTitle.toLowerCase().includes(q) ||
        f.targetId.toLowerCase().includes(q) ||
        f.flagType.toLowerCase().includes(q) ||
        f.details.toLowerCase().includes(q)
    );
  }, [flags, flagSearch]);

  const filteredAuditLogs = useMemo(() => {
    if (!auditSearch.trim()) return auditLogs;
    const q = auditSearch.toLowerCase();
    return auditLogs.filter(
      (l) =>
        l.targetTitle.toLowerCase().includes(q) ||
        l.adminEmail.toLowerCase().includes(q) ||
        l.reason.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q)
    );
  }, [auditLogs, auditSearch]);

  const flagMetrics = useMemo(() => {
    return {
      total: flags.length,
      open: flags.filter((f) => f.status === 'OPEN').length,
      investigating: flags.filter((f) => f.status === 'INVESTIGATING').length,
      highSeverity: flags.filter((f) => f.severity === 'HIGH').length,
    };
  }, [flags]);

  const getSeverityBadge = (sev: SecuritySeverity) => {
    switch (sev) {
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30">High Severity</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">Medium</span>;
      case 'LOW':
        return <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30">Low</span>;
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Tab Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>Anti-Abuse, Spam & Audit Trail</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white font-['Syne',sans-serif]">
            Platform Security & Audit Logs
          </h2>
          <p className="text-xs text-slate-400 max-w-xl">
            Monitor automated spam detections, repeated user reports, artificial stream spikes, and review the full immutable audit trail of moderator actions.
          </p>
        </div>

        {/* Sub-tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => setActiveSubTab('flags')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'flags'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Abuse Flags ({flags.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('audit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'audit'
                ? 'bg-[#1455D9] text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit Trail</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'flags' ? (
        <>
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-[#11151F] border border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Abuse Signals</span>
              <div className="text-2xl font-extrabold text-white mt-1 font-['Syne',sans-serif]">{flagMetrics.total}</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#11151F] border border-rose-500/30">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">High Severity</span>
              <div className="text-2xl font-extrabold text-rose-400 mt-1 font-['Syne',sans-serif]">{flagMetrics.highSeverity}</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#11151F] border border-amber-500/30">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Open For Review</span>
              <div className="text-2xl font-extrabold text-amber-400 mt-1 font-['Syne',sans-serif]">{flagMetrics.open}</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#11151F] border border-blue-500/30">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Investigating</span>
              <div className="text-2xl font-extrabold text-blue-400 mt-1 font-['Syne',sans-serif]">{flagMetrics.investigating}</div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="p-3.5 rounded-2xl bg-[#11151F] border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={flagSearch}
                onChange={(e) => setFlagSearch(e.target.value)}
                placeholder="Search by flag type, target ID, target title, or details..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#1455D9]"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value as any)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-[#1455D9]"
              >
                <option value="ALL">All Severities</option>
                <option value="HIGH">High Severity</option>
                <option value="MEDIUM">Medium Severity</option>
                <option value="LOW">Low Severity</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-[#1455D9]"
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">Open Only</option>
                <option value="INVESTIGATING">Investigating</option>
                <option value="RESOLVED">Resolved</option>
                <option value="DISMISSED">Dismissed</option>
              </select>

              <button
                onClick={fetchSecurityFlags}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                title="Refresh Flags"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFlags ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Flags List */}
          {isLoadingFlags ? (
            <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
              <span>Scanning platform security flags...</span>
            </div>
          ) : filteredFlags.length === 0 ? (
            <div className="p-12 rounded-3xl bg-[#11151F] border border-slate-800 text-center space-y-2">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto opacity-70" />
              <h3 className="text-sm font-bold text-white">Platform Clean - No Abuse Flags</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No suspicious accounts, spam playlists, or repeated reports detected.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFlags.map((flag) => (
                <div
                  key={flag.id}
                  className="p-4 rounded-2xl bg-[#11151F] border border-slate-800 hover:border-slate-700 transition space-y-3"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
                    <div className="flex items-center gap-2">
                      {getSeverityBadge(flag.severity)}
                      <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                        {flag.flagType}
                      </span>
                      <h4 className="text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
                        {flag.targetTitle}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                        flag.status === 'OPEN'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : flag.status === 'INVESTIGATING'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {flag.status}
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        {new Date(flag.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Flag specifics */}
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 text-xs text-slate-300">
                    <p>{flag.details}</p>
                    {flag.reportedCount > 1 && (
                      <span className="text-[11px] font-bold text-rose-400 block mt-1">
                        Reported {flag.reportedCount} separate times by community members.
                      </span>
                    )}
                  </div>

                  {/* Admin notes */}
                  {flag.adminNotes && (
                    <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
                      <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Investigator note: </span>
                        <span>{flag.adminNotes}</span>
                      </div>
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/40">
                    <span className="text-[11px] text-slate-500 font-mono">
                      Target: {flag.targetType} ({flag.targetId})
                    </span>
                    <button
                      onClick={() => handleOpenResolveFlag(flag)}
                      className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow"
                    >
                      <Shield className="w-3 h-3" />
                      <span>Resolve / Investigate</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* AUDIT TRAIL LOG VIEWER */
        <div className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-[#11151F] border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="Search audit trail by admin email, target title, or action..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#1455D9]"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={auditActionFilter}
                onChange={(e) => setAuditActionFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-[#1455D9]"
              >
                <option value="ALL">All Actions</option>
                <option value="HIDE_CONTENT">Hide Content</option>
                <option value="RESTORE_CONTENT">Restore Content</option>
                <option value="COPYRIGHT_TAKEDOWN">Copyright Takedown</option>
                <option value="COPYRIGHT_RESTORE">Copyright Restore</option>
                <option value="SUSPEND_USER">Suspend User</option>
                <option value="REINSTATE_USER">Reinstate User</option>
                <option value="RESOLVE_SECURITY_FLAG">Resolve Flag</option>
              </select>

              <button
                onClick={fetchAuditLogs}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                title="Refresh Audit Trail"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLogs ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {isLoadingLogs ? (
            <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#1455D9]" />
              <span>Loading audit logs...</span>
            </div>
          ) : filteredAuditLogs.length === 0 ? (
            <div className="p-12 rounded-3xl bg-[#11151F] border border-slate-800 text-center space-y-2">
              <FileSpreadsheet className="w-10 h-10 text-slate-500 mx-auto opacity-70" />
              <h3 className="text-sm font-bold text-white">No Audit Records Yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Moderation actions taken by administrators will appear here as an immutable audit trail.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-xs text-left text-slate-300 bg-[#11151F]">
                <thead className="text-[10px] uppercase font-bold text-slate-400 bg-slate-900/90 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Administrator</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Target</th>
                    <th className="px-4 py-3">Reason / Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/50 transition">
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-semibold text-white whitespace-nowrap">
                        {log.adminEmail}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-indigo-300 border border-slate-700">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-200">
                        <span className="text-[10px] uppercase text-slate-500 mr-1.5">[{log.targetType}]</span>
                        {log.targetTitle}
                      </td>
                      <td className="px-4 py-3 text-slate-400 max-w-xs truncate">
                        {log.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* FLAG RESOLVE MODAL */}
      {selectedFlag && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in"
          onClick={handleCloseResolveModal}
        >
          <div
            className="w-full max-w-md bg-[#11151F] border border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-6 space-y-4 animate-in zoom-in-95 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Investigate Security Flag</h3>
              </div>
              <button
                onClick={handleCloseResolveModal}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-slate-400">Trigger Target</div>
              <div className="font-bold text-white">{selectedFlag.targetTitle}</div>
              <p className="text-slate-400">{selectedFlag.details}</p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Set Resolution Status</label>
                <select
                  value={resolutionStatus}
                  onChange={(e) => setResolutionStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-[#1455D9]"
                >
                  <option value="INVESTIGATING">Mark as Under Investigation</option>
                  <option value="RESOLVED">Mark as Resolved</option>
                  <option value="DISMISSED">Dismiss as False Positive</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Investigation Notes</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Record outcome of review or security actions taken..."
                  rows={3}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-[#1455D9] resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={handleCloseResolveModal}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                disabled={isResolving}
                onClick={handleSaveResolution}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold transition shadow"
              >
                {isResolving ? 'Saving...' : 'Save Resolution'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
