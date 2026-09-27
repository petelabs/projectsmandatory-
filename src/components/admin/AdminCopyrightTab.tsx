import React, { useState, useEffect, useMemo } from 'react';
import {
  Scale,
  Search,
  Filter,
  CheckCircle,
  EyeOff,
  RotateCcw,
  AlertTriangle,
  Info,
  Clock,
  ExternalLink,
  FileCheck,
  X,
  RefreshCw,
  HelpCircle,
  ShieldCheck,
  Send,
} from 'lucide-react';
import {
  CopyrightReport,
  CopyrightReportStatus,
  CopyrightReportAction,
} from '../../types';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext';

interface AdminCopyrightTabProps {
  token?: string;
  adminEmail?: string;
}

export const AdminCopyrightTab: React.FC<AdminCopyrightTabProps> = ({
  token,
  adminEmail,
}) => {
  const { showToast } = useToast();
  const [reports, setReports] = useState<CopyrightReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | CopyrightReportStatus>('ALL');

  // Review Modal state
  const [selectedClaim, setSelectedClaim] = useState<CopyrightReport | null>(null);
  const [modalStatus, setModalStatus] = useState<CopyrightReportStatus>('UNDER_REVIEW');
  const [modalAction, setModalAction] = useState<CopyrightReportAction>('NONE');
  const [modalNotes, setModalNotes] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const fetchCopyrightReports = async () => {
    setIsLoading(true);
    try {
      const res = await api.adminGetCopyrightReports(token, {
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: searchQuery || undefined,
      });
      if (res.success && res.reports) {
        setReports(res.reports);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load copyright reports', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCopyrightReports();
  }, [statusFilter]);

  const handleOpenReview = (claim: CopyrightReport) => {
    setSelectedClaim(claim);
    setModalStatus(claim.status === 'SUBMITTED' ? 'UNDER_REVIEW' : claim.status);
    setModalAction(claim.actionTaken || 'NONE');
    setModalNotes(claim.moderationNotes || '');
  };

  const handleCloseReview = () => {
    setSelectedClaim(null);
    setModalNotes('');
    setModalAction('NONE');
  };

  const handleSaveReview = async () => {
    if (!selectedClaim) return;
    setIsSubmittingReview(true);
    try {
      const res = await api.adminReviewCopyrightReport(token, selectedClaim.id, {
        status: modalStatus,
        actionTaken: modalAction,
        moderationNotes: modalNotes,
        adminEmail: adminEmail || 'Admin',
      });

      if (res.success) {
        showToast(`Copyright claim ${selectedClaim.id} updated`, 'success');
        setReports((prev) =>
          prev.map((c) =>
            c.id === selectedClaim.id
              ? {
                  ...c,
                  status: modalStatus,
                  actionTaken: modalAction,
                  moderationNotes: modalNotes,
                  reviewedBy: adminEmail || 'Admin',
                  reviewedAt: new Date().toISOString(),
                }
              : c
          )
        );
        handleCloseReview();
      } else {
        throw new Error(res.error || 'Failed to update copyright claim');
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating copyright report', 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const filteredReports = useMemo(() => {
    if (!searchQuery.trim()) return reports;
    const q = searchQuery.toLowerCase();
    return reports.filter(
      (c) =>
        c.targetTitle.toLowerCase().includes(q) ||
        c.targetId.toLowerCase().includes(q) ||
        c.claimantName.toLowerCase().includes(q) ||
        c.claimantEmail.toLowerCase().includes(q) ||
        c.originalWorkTitle.toLowerCase().includes(q) ||
        c.infringementDescription.toLowerCase().includes(q)
    );
  }, [reports, searchQuery]);

  const metrics = useMemo(() => {
    return {
      total: reports.length,
      submitted: reports.filter((c) => c.status === 'SUBMITTED').length,
      underReview: reports.filter((c) => c.status === 'UNDER_REVIEW').length,
      actionTaken: reports.filter((c) => c.status === 'ACTION_TAKEN').length,
      closed: reports.filter((c) => c.status === 'CLOSED').length,
    };
  }, [reports]);

  const getStatusBadge = (status: CopyrightReportStatus) => {
    switch (status) {
      case 'SUBMITTED':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">Submitted</span>;
      case 'UNDER_REVIEW':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">Under Review</span>;
      case 'MORE_INFO_REQUIRED':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">Info Needed</span>;
      case 'ACTION_TAKEN':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">Takedown Executed</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-700/40 text-slate-400 border border-slate-700/60">Claim Rejected</span>;
      case 'CLOSED':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Closed</span>;
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Tab Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Scale className="w-3.5 h-3.5" />
            <span>Intellectual Property & Legal Protection</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white font-['Syne',sans-serif]">
            Copyright & Takedown Queue
          </h2>
          <p className="text-xs text-slate-400 max-w-xl">
            Manage DMCA notices and copyright takedown requests from artists, rights holders, and producers. Every action requires human review and is logged into an immutable audit trail.
          </p>
        </div>
        <button
          onClick={fetchCopyrightReports}
          disabled={isLoading}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-2 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-[#11151F] border border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Notices</span>
          <div className="text-2xl font-extrabold text-white mt-1 font-['Syne',sans-serif]">{metrics.total}</div>
        </div>
        <div className="p-4 rounded-2xl bg-[#11151F] border border-amber-500/30">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">New Submissions</span>
          <div className="text-2xl font-extrabold text-amber-400 mt-1 font-['Syne',sans-serif]">{metrics.submitted}</div>
        </div>
        <div className="p-4 rounded-2xl bg-[#11151F] border border-rose-500/30">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Takedowns Executed</span>
          <div className="text-2xl font-extrabold text-rose-400 mt-1 font-['Syne',sans-serif]">{metrics.actionTaken}</div>
        </div>
        <div className="p-4 rounded-2xl bg-[#11151F] border border-emerald-500/30">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Resolved / Closed</span>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1 font-['Syne',sans-serif]">{metrics.closed}</div>
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
            placeholder="Search by disputed track title, claimant name, original work, or ID..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#1455D9]"
          />
        </div>
        <div className="flex items-center gap-2">
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
            <option value="SUBMITTED">Submitted (New)</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="MORE_INFO_REQUIRED">More Info Required</option>
            <option value="ACTION_TAKEN">Action Taken (Takedown)</option>
            <option value="REJECTED">Rejected</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {/* Copyright Notices List */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
          <span>Loading copyright claims queue...</span>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[#11151F] border border-slate-800 text-center space-y-2">
          <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto opacity-70" />
          <h3 className="text-sm font-bold text-white">No Copyright Claims in Queue</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Zero copyright infringements or takedown claims matching your active filter.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReports.map((claim) => (
            <div
              key={claim.id}
              className="p-4 rounded-2xl bg-[#11151F] border border-slate-800 hover:border-slate-700 transition space-y-3"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-rose-950/80 text-rose-300 border border-rose-500/30">
                    Disputed {claim.targetType}
                  </span>
                  <h4 className="text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
                    {claim.targetTitle}
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                    Claim: {claim.id}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(claim.status)}
                  <span className="text-[11px] text-slate-500">
                    {new Date(claim.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Claim Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Claimant / Rights Owner</span>
                  <span className="font-semibold text-indigo-300 block">{claim.claimantName}</span>
                  <span className="text-[11px] text-slate-400">{claim.claimantEmail} {claim.claimantPhone ? `• ${claim.claimantPhone}` : ''}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Original Work Claimed</span>
                  <span className="text-slate-200 font-medium block">{claim.originalWorkTitle}</span>
                  {claim.originalWorkProofUrl && (
                    <a
                      href={claim.originalWorkProofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-[#1455D9] hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Verify External Work</span>
                    </a>
                  )}
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Legal Statement</span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 mt-0.5">
                    <FileCheck className="w-3 h-3" />
                    <span>Perjury Sworn Declaration Signed</span>
                  </span>
                </div>
              </div>

              {/* Description Statement */}
              {claim.infringementDescription && (
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Allegation Statement:
                  </span>
                  <p className="italic">"{claim.infringementDescription}"</p>
                </div>
              )}

              {/* Moderator notes if existing */}
              {claim.moderationNotes && (
                <div className="p-2.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-300 flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold">Legal Reviewer Note ({claim.reviewedBy || 'Admin'}): </span>
                    <span>{claim.moderationNotes}</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/40">
                <div className="flex items-center gap-1.5">
                  {claim.actionTaken && claim.actionTaken !== 'NONE' && (
                    <span className="text-[10px] font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                      Executed: {claim.actionTaken}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenReview(claim)}
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow"
                  >
                    <Scale className="w-3 h-3" />
                    <span>Review & Adjudicate</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* COPYRIGHT REVIEW MODAL */}
      {selectedClaim && (
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
                <Scale className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">
                  DMCA Copyright Takedown Adjudication
                </h3>
              </div>
              <button
                onClick={handleCloseReview}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Comparison Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-500/20 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block">
                  Disputed Storefront Content
                </span>
                <div className="font-bold text-white text-sm">{selectedClaim.targetTitle}</div>
                <div className="text-slate-400">Target ID: {selectedClaim.targetId}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block">
                  Claimant's Original Work
                </span>
                <div className="font-bold text-white text-sm">{selectedClaim.originalWorkTitle}</div>
                <div className="text-slate-400">Claimant: {selectedClaim.claimantName}</div>
                {selectedClaim.originalWorkProofUrl && (
                  <a
                    href={selectedClaim.originalWorkProofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#1455D9] hover:underline flex items-center gap-1 text-[11px] pt-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Open External Reference</span>
                  </a>
                )}
              </div>
            </div>

            {/* Allegation Narrative */}
            <div className="space-y-1 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Infringement Explanation
              </span>
              <p className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 italic">
                "{selectedClaim.infringementDescription || 'No detailed statement provided.'}"
              </p>
            </div>

            {/* Adjudication Controls */}
            <div className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 text-xs">
                  <label className="font-bold text-slate-300 block">Notice Status</label>
                  <select
                    value={modalStatus}
                    onChange={(e) => setModalStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-[#1455D9]"
                  >
                    <option value="SUBMITTED">Submitted</option>
                    <option value="UNDER_REVIEW">Under Review</option>
                    <option value="MORE_INFO_REQUIRED">More Information Required</option>
                    <option value="ACTION_TAKEN">Action Taken (Infringement Upheld)</option>
                    <option value="REJECTED">Rejected (Invalid Claim)</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>

                <div className="space-y-1 text-xs">
                  <label className="font-bold text-slate-300 block">Takedown Action</label>
                  <select
                    value={modalAction}
                    onChange={(e) => setModalAction(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-[#1455D9]"
                  >
                    <option value="NONE">None (Keep Track Live)</option>
                    <option value="CONTENT_TAKEDOWN">Take Down Music Release</option>
                    <option value="CONTENT_RESTORED">Restore / Un-takedown Content</option>
                    <option value="REJECTED_INVALID">Reject as Frivolous / Invalid</option>
                  </select>
                </div>
              </div>

              {/* Warning on Takedown */}
              {modalAction === 'CONTENT_TAKEDOWN' && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <p>
                    <strong>Takedown Impact: </strong>
                    Executing a content takedown will immediately hide this song from public playback, remove it from search, and tag it with a copyright notice. The uploader artist will see a notice of dispute.
                  </p>
                </div>
              )}

              {/* Internal Notes */}
              <div className="space-y-1 text-xs">
                <label className="font-bold text-slate-300 block">
                  Official Moderation & Legal Decision Notes (Immutable Audit Trail)
                </label>
                <textarea
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  placeholder="Record comparison results, verified metadata, or correspondence..."
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
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition shadow-lg shadow-indigo-950/40 flex items-center gap-1.5"
                >
                  {isSubmittingReview ? (
                    <span>Recording Decision...</span>
                  ) : (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Log Legal Decision</span>
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
