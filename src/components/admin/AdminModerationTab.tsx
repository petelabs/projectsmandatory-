import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  CheckCircle,
  EyeOff,
  RotateCcw,
  UserX,
  UserCheck,
  AlertTriangle,
  Info,
  Clock,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  FileText,
  X,
  RefreshCw,
} from 'lucide-react';
import {
  ContentReport,
  ContentReportStatus,
  ContentReportResolution,
  ContentReportTargetType,
} from '../../types';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext';

interface AdminModerationTabProps {
  token?: string;
  adminEmail?: string;
}

export const AdminModerationTab: React.FC<AdminModerationTabProps> = ({
  token,
  adminEmail,
}) => {
  const { showToast } = useToast();
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ContentReportStatus>('ALL');
  const [targetTypeFilter, setTargetTypeFilter] = useState<'ALL' | ContentReportTargetType>('ALL');
  
  // Review Modal State
  const [selectedReport, setSelectedReport] = useState<ContentReport | null>(null);
  const [modalStatus, setModalStatus] = useState<ContentReportStatus>('UNDER_REVIEW');
  const [modalAction, setModalAction] = useState<ContentReportResolution>('NONE');
  const [modalNotes, setModalNotes] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const res = await api.adminGetReports(token, {
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        targetType: targetTypeFilter !== 'ALL' ? targetTypeFilter : undefined,
        search: searchQuery || undefined,
      });
      if (res.success && res.reports) {
        setReports(res.reports);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load content reports', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter, targetTypeFilter]);

  const handleOpenReview = (report: ContentReport) => {
    setSelectedReport(report);
    setModalStatus(report.status === 'PENDING' ? 'UNDER_REVIEW' : report.status);
    setModalAction(report.resolutionAction || 'NONE');
    setModalNotes(report.moderationNotes || '');
  };

  const handleCloseReview = () => {
    setSelectedReport(null);
    setModalNotes('');
    setModalAction('NONE');
  };

  const handleSaveReview = async () => {
    if (!selectedReport) return;
    setIsSubmittingReview(true);
    try {
      const res = await api.adminReviewReport(token, selectedReport.id, {
        status: modalStatus,
        resolutionAction: modalAction,
        moderationNotes: modalNotes,
        adminEmail: adminEmail || 'Admin',
      });

      if (res.success) {
        showToast(`Report ${selectedReport.id} successfully reviewed`, 'success');
        // Update local list
        setReports((prev) =>
          prev.map((r) =>
            r.id === selectedReport.id
              ? {
                  ...r,
                  status: modalStatus,
                  resolutionAction: modalAction,
                  moderationNotes: modalNotes,
                  reviewedBy: adminEmail || 'Admin',
                  reviewedAt: new Date().toISOString(),
                }
              : r
          )
        );
        handleCloseReview();
      } else {
        throw new Error(res.error || 'Failed to update report');
      }
    } catch (err: any) {
      showToast(err.message || 'Error saving review', 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Quick Action Handler for instant direct moderation
  const handleQuickAction = async (
    report: ContentReport,
    action: ContentReportResolution,
    newStatus: ContentReportStatus
  ) => {
    try {
      const res = await api.adminReviewReport(token, report.id, {
        status: newStatus,
        resolutionAction: action,
        moderationNotes: `Quick ${action.replace('_', ' ').toLowerCase()} executed by ${adminEmail || 'Admin'}`,
        adminEmail: adminEmail || 'Admin',
      });

      if (res.success) {
        showToast(`Action applied: ${action.replace('_', ' ')}`, 'success');
        fetchReports();
      }
    } catch (err: any) {
      showToast(err.message || 'Action failed', 'error');
    }
  };

  const filteredReports = useMemo(() => {
    if (!searchQuery.trim()) return reports;
    const q = searchQuery.toLowerCase();
    return reports.filter(
      (r) =>
        r.targetTitle.toLowerCase().includes(q) ||
        r.targetId.toLowerCase().includes(q) ||
        r.reporterEmail.toLowerCase().includes(q) ||
        r.reporterName.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
    );
  }, [reports, searchQuery]);

  const metrics = useMemo(() => {
    return {
      total: reports.length,
      pending: reports.filter((r) => r.status === 'PENDING').length,
      underReview: reports.filter((r) => r.status === 'UNDER_REVIEW').length,
      resolved: reports.filter((r) => r.status === 'RESOLVED').length,
      dismissed: reports.filter((r) => r.status === 'DISMISSED').length,
    };
  }, [reports]);

  const getStatusBadge = (status: ContentReportStatus) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">Pending</span>;
      case 'UNDER_REVIEW':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">Under Review</span>;
      case 'RESOLVED':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Resolved</span>;
      case 'DISMISSED':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-700/40 text-slate-400 border border-slate-700/60">Dismissed</span>;
    }
  };

  const getReasonLabel = (reason: string) => {
    return reason.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="space-y-6 text-left">
      {/* Tab Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Community Trust & Safety</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white font-['Syne',sans-serif]">
            Content Reports & Moderation
          </h2>
          <p className="text-xs text-slate-400 max-w-xl">
            Review listener and creator reports for inappropriate content, hate speech, spam, and track abuse. Take fair, auditable action to keep Projects Mandatory safe.
          </p>
        </div>
        <button
          onClick={fetchReports}
          disabled={isLoading}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-2 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-[#11151F] border border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Reports</span>
          <div className="text-2xl font-extrabold text-white mt-1 font-['Syne',sans-serif]">{metrics.total}</div>
        </div>
        <div className="p-4 rounded-2xl bg-[#11151F] border border-amber-500/30">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Pending Review</span>
          <div className="text-2xl font-extrabold text-amber-400 mt-1 font-['Syne',sans-serif]">{metrics.pending}</div>
        </div>
        <div className="p-4 rounded-2xl bg-[#11151F] border border-blue-500/30">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Under Review</span>
          <div className="text-2xl font-extrabold text-blue-400 mt-1 font-['Syne',sans-serif]">{metrics.underReview}</div>
        </div>
        <div className="p-4 rounded-2xl bg-[#11151F] border border-emerald-500/30">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Resolved</span>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1 font-['Syne',sans-serif]">{metrics.resolved}</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-3.5 rounded-2xl bg-[#11151F] border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by track title, ID, reporter email, or reason..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#1455D9]"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-[#1455D9]"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Only</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="RESOLVED">Resolved</option>
            <option value="DISMISSED">Dismissed</option>
          </select>

          <select
            value={targetTypeFilter}
            onChange={(e) => setTargetTypeFilter(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-[#1455D9]"
          >
            <option value="ALL">All Content Types</option>
            <option value="song">Songs</option>
            <option value="album">Albums</option>
            <option value="artist">Artists</option>
            <option value="playlist">Playlists</option>
            <option value="user">Users</option>
          </select>
        </div>
      </div>

      {/* Reports Content List */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-rose-500" />
          <span>Loading content moderation reports...</span>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[#11151F] border border-slate-800 text-center space-y-2">
          <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto opacity-70" />
          <h3 className="text-sm font-bold text-white">No Reports Matching Filter</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            All caught up! There are currently no community content reports matching your active filters.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="p-4 rounded-2xl bg-[#11151F] border border-slate-800 hover:border-slate-700 transition space-y-3"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-indigo-950/80 text-indigo-300 border border-indigo-500/30">
                    {report.targetType}
                  </span>
                  <h4 className="text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
                    {report.targetTitle}
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                    ID: {report.targetId}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(report.status)}
                  <span className="text-[11px] text-slate-500">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Reason</span>
                  <span className="font-semibold text-rose-300 bg-rose-500/10 px-2 py-0.5 rounded inline-block mt-0.5">
                    {getReasonLabel(report.reason)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Reported By</span>
                  <span className="text-slate-300 font-medium">
                    {report.reporterName} ({report.reporterEmail})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Owner / Creator</span>
                  <span className="text-slate-300 font-medium">
                    {report.targetOwnerName || 'Platform Creator'}
                  </span>
                </div>
              </div>

              {/* User Description */}
              {report.description && (
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <p className="line-clamp-2 italic">"{report.description}"</p>
                </div>
              )}

              {/* Moderator Decision notes if present */}
              {report.moderationNotes && (
                <div className="p-2 rounded-xl bg-blue-950/30 border border-blue-500/20 text-xs text-blue-300 flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold">Moderator note ({report.reviewedBy || 'Admin'}): </span>
                    <span>{report.moderationNotes}</span>
                  </div>
                </div>
              )}

              {/* Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/40">
                <div className="flex items-center gap-1.5">
                  {report.resolutionAction && report.resolutionAction !== 'NONE' && (
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Action: {report.resolutionAction}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Quick Hide Content */}
                  <button
                    onClick={() => handleQuickAction(report, 'CONTENT_HIDDEN', 'RESOLVED')}
                    className="px-2.5 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 text-xs font-semibold transition flex items-center gap-1"
                    title="Hide content immediately from public storefront"
                  >
                    <EyeOff className="w-3 h-3" />
                    <span className="hidden sm:inline">Hide Content</span>
                  </button>

                  {/* Quick Restore Content */}
                  <button
                    onClick={() => handleQuickAction(report, 'CONTENT_RESTORED', 'RESOLVED')}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition flex items-center gap-1"
                    title="Restore content to public catalog"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span className="hidden sm:inline">Restore</span>
                  </button>

                  {/* Review & Formal Decision */}
                  <button
                    onClick={() => handleOpenReview(report)}
                    className="px-3.5 py-1.5 rounded-lg bg-[#1455D9] hover:bg-[#1146B8] text-white text-xs font-bold transition flex items-center gap-1.5 shadow"
                  >
                    <FileText className="w-3 h-3" />
                    <span>Review & Decide</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODERATION REVIEW MODAL */}
      {selectedReport && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in"
          onClick={handleCloseReview}
        >
          <div
            className="w-full max-w-xl bg-[#11151F] border border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-6 space-y-5 animate-in zoom-in-95 text-left max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-bold text-white">
                  Content Moderation Review
                </h3>
              </div>
              <button
                onClick={handleCloseReview}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target Information Card */}
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Target {selectedReport.targetType}
                </span>
                <span className="font-mono text-slate-500">ID: {selectedReport.targetId}</span>
              </div>
              <div className="text-sm font-bold text-white">{selectedReport.targetTitle}</div>
              <div className="text-slate-400">
                Creator: <span className="text-white">{selectedReport.targetOwnerName || 'Unknown'}</span>
              </div>
            </div>

            {/* Reporter Claim Details */}
            <div className="space-y-1 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Community Report Allegation
              </span>
              <div className="p-3 rounded-2xl bg-rose-950/20 border border-rose-500/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-300">
                    Reason: {getReasonLabel(selectedReport.reason)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    From {selectedReport.reporterName} ({selectedReport.reporterEmail})
                  </span>
                </div>
                {selectedReport.description ? (
                  <p className="text-slate-300 italic">"{selectedReport.description}"</p>
                ) : (
                  <p className="text-slate-500 italic">No additional text was submitted by reporter.</p>
                )}
              </div>
            </div>

            {/* Review Decision Form */}
            <div className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 text-xs">
                  <label className="font-bold text-slate-300 block">Report Status</label>
                  <select
                    value={modalStatus}
                    onChange={(e) => setModalStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-[#1455D9]"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="UNDER_REVIEW">Under Review</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="DISMISSED">Dismissed (Unfounded)</option>
                  </select>
                </div>

                <div className="space-y-1 text-xs">
                  <label className="font-bold text-slate-300 block">Moderation Action</label>
                  <select
                    value={modalAction}
                    onChange={(e) => setModalAction(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-[#1455D9]"
                  >
                    <option value="NONE">None (Keep Content As Is)</option>
                    <option value="CONTENT_HIDDEN">Hide Content from Public Catalog</option>
                    <option value="CONTENT_RESTORED">Restore / Unhide Content</option>
                    <option value="ACCOUNT_SUSPENDED">Suspend User / Creator Account</option>
                    <option value="ACCOUNT_REINSTATED">Reinstate Account</option>
                    <option value="WARNING_ISSUED">Issue Policy Warning</option>
                    <option value="DISMISSED">Dismiss Report</option>
                  </select>
                </div>
              </div>

              {/* Warning when choosing destructive action */}
              {(modalAction === 'CONTENT_HIDDEN' || modalAction === 'ACCOUNT_SUSPENDED') && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p>
                    <strong>Consequence: </strong>
                    {modalAction === 'CONTENT_HIDDEN'
                      ? 'This song or album will be set to hidden immediately. It will no longer appear on the home page, music search, or playlists.'
                      : 'Suspending this account will disable the artist or user from uploading, editing, or making withdrawals until reinstated.'}
                  </p>
                </div>
              )}

              {/* Internal Moderation Notes */}
              <div className="space-y-1 text-xs">
                <label className="font-bold text-slate-300 block">
                  Internal Moderator Decision Notes (Auditable)
                </label>
                <textarea
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  placeholder="Record your reasoning, timestamp checks, or communication with creator..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-[#1455D9] resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleCloseReview}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmittingReview}
                  onClick={handleSaveReview}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold transition shadow-lg shadow-rose-950/40 flex items-center gap-1.5"
                >
                  {isSubmittingReview ? (
                    <span>Saving Decision...</span>
                  ) : (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Apply & Log Decision</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
