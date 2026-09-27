import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  ShieldAlert,
  FileText,
  CheckCircle2,
  HelpCircle,
  Lock,
  ExternalLink,
  Send,
  Scale,
} from 'lucide-react';
import { ContentReportReason, ContentReportTargetType } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../lib/api';
import { MyReportsModal } from './MyReportsModal';

interface ReportContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: ContentReportTargetType;
  targetId: string;
  targetTitle: string;
  targetOwnerId?: string;
  targetOwnerName?: string;
  initialMode?: 'report' | 'copyright';
}

const REPORT_REASONS: { id: ContentReportReason; label: string; desc: string }[] = [
  {
    id: 'inappropriate_content',
    label: 'Inappropriate or Explicit Audio',
    desc: 'Contains sexually explicit audio, violence, or dangerous content without warning.',
  },
  {
    id: 'hate_speech',
    label: 'Hate Speech or Discrimination',
    desc: 'Attacks or discriminates based on race, religion, gender, ethnicity, or disability.',
  },
  {
    id: 'harassment',
    label: 'Harassment or Defamation',
    desc: 'Targeted abuse, bullying, doxxing, or defamatory personal attacks.',
  },
  {
    id: 'spam',
    label: 'Spam or Misleading Metadata',
    desc: 'Deceptive title, repetitive uploads, keyword stuffing, or empty/corrupt audio.',
  },
  {
    id: 'impersonation',
    label: 'Artist Impersonation',
    desc: 'Pretending to be another artist, record label, or producer without permission.',
  },
  {
    id: 'offensive_artwork',
    label: 'Offensive Artwork or Imagery',
    desc: 'Cover image is vulgar, violent, graphic, or violates community standards.',
  },
  {
    id: 'low_quality',
    label: 'Severe Distortion or Broken Master',
    desc: 'Audio is completely silent, corrupted, or unlistenable.',
  },
  {
    id: 'other',
    label: 'Other Concern',
    desc: 'Any other platform violation not covered above.',
  },
];

export const ReportContentModal: React.FC<ReportContentModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetTitle,
  targetOwnerId,
  targetOwnerName,
  initialMode = 'report',
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { isDark } = useTheme();

  const [mode, setMode] = useState<'report' | 'copyright'>(initialMode);
  const [selectedReason, setSelectedReason] = useState<ContentReportReason>('inappropriate_content');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRefId, setSubmittedRefId] = useState<string | null>(null);
  const [showMyReportsModal, setShowMyReportsModal] = useState(false);

  // Copyright Specific Fields
  const [claimantName, setClaimantName] = useState(user?.name || '');
  const [claimantEmail, setClaimantEmail] = useState(user?.email || '');
  const [claimantPhone, setClaimantPhone] = useState('');
  const [originalWorkTitle, setOriginalWorkTitle] = useState('');
  const [originalWorkProofUrl, setOriginalWorkProofUrl] = useState('');
  const [infringementDescription, setInfringementDescription] = useState('');
  const [declarationAccepted, setDeclarationAccepted] = useState(false);

  if (!isOpen) return null;

  const handleResetAndClose = () => {
    setSubmittedRefId(null);
    setDescription('');
    setInfringementDescription('');
    onClose();
  };

  const handleSubmitGeneralReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReason) {
      showToast('Please select a reason for reporting', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.submitReport({
        reporterId: user?.id || 'anonymous',
        reporterEmail: user?.email || 'anonymous@listener.pm',
        reporterName: user?.name || 'Listener',
        targetType,
        targetId,
        targetTitle,
        targetOwnerId,
        targetOwnerName,
        reason: selectedReason,
        description,
      });

      if (res.success && res.report) {
        setSubmittedRefId(res.report.id);
        showToast('Report submitted for moderation review', 'success');
      } else {
        throw new Error(res.error || 'Failed to submit report.');
      }
    } catch (err: any) {
      showToast(err.message || 'Error submitting report', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitCopyrightNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimantName.trim() || !claimantEmail.trim()) {
      showToast('Please provide your name and contact email', 'error');
      return;
    }
    if (!declarationAccepted) {
      showToast('You must affirm the good faith legal declaration', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.submitCopyrightReport({
        reporterId: user?.id,
        claimantName: claimantName.trim(),
        claimantEmail: claimantEmail.trim(),
        claimantPhone: claimantPhone.trim(),
        targetType,
        targetId,
        targetTitle,
        originalWorkTitle: originalWorkTitle.trim() || targetTitle,
        originalWorkProofUrl: originalWorkProofUrl.trim(),
        infringementDescription: infringementDescription.trim(),
        declarationAccepted: true,
      });

      if (res.success && res.report) {
        setSubmittedRefId(res.report.id);
        showToast('Copyright infringement claim filed successfully', 'success');
      } else {
        throw new Error(res.error || 'Failed to file copyright notice.');
      }
    } catch (err: any) {
      showToast(err.message || 'Error filing copyright notice', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className={`relative w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-['Syne',sans-serif]">Report Content</h2>
              <p className="text-xs text-slate-400">
                {targetType.toUpperCase()}: <span className="font-semibold text-slate-200">{targetTitle}</span>
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Confirmation State */}
        {submittedRefId ? (
          <div className="p-8 text-center space-y-4 my-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xl font-bold font-['Syne',sans-serif]">Report Received</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Thank you for helping keep Projects Mandatory safe and respectful for creators and listeners.
                Our editorial moderation team will inspect this item.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/50 max-w-xs mx-auto text-left">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Reference ID</span>
              <p className="font-mono text-xs font-bold text-indigo-400 select-all">{submittedRefId}</p>
            </div>

            <p className="text-[11px] text-slate-500">
              Content is never deleted automatically; a human moderator reviews every report. You can track this in your Account.
            </p>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowMyReportsModal(true)}
                className="flex-1 py-3 rounded-2xl bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-500/30 text-indigo-300 font-bold text-xs uppercase tracking-wider transition"
              >
                Track My Reports
              </button>
              <button
                type="button"
                onClick={handleResetAndClose}
                className="flex-1 py-3 rounded-2xl bg-[#1455D9] hover:bg-[#1043ac] text-white font-bold text-xs uppercase tracking-wider transition shadow-lg"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Mode Switch Tabs */}
            <div className="p-4 pb-0 shrink-0">
              <div className="flex rounded-2xl bg-slate-800/60 p-1 border border-slate-700/50">
                <button
                  type="button"
                  onClick={() => setMode('report')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    mode === 'report' ? 'bg-[#1455D9] text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Community Issue</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('copyright')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    mode === 'copyright' ? 'bg-[#1455D9] text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>Copyright Takedown</span>
                </button>
              </div>
            </div>

            {/* Scrollable Form Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              {mode === 'report' ? (
                <form onSubmit={handleSubmitGeneralReport} className="space-y-4 text-left">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-300">
                      Why are you reporting this {targetType}?
                    </label>
                    <div className="space-y-2">
                      {REPORT_REASONS.map((r) => (
                        <label
                          key={r.id}
                          className={`p-3 rounded-2xl border flex items-start gap-3 cursor-pointer transition select-none ${
                            selectedReason === r.id
                              ? 'bg-rose-500/10 border-rose-500/50 text-white'
                              : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <input
                            type="radio"
                            name="reportReason"
                            value={r.id}
                            checked={selectedReason === r.id}
                            onChange={() => setSelectedReason(r.id)}
                            className="mt-1 text-rose-500 focus:ring-rose-500"
                          />
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold block">{r.label}</span>
                            <span className="text-[11px] text-slate-400 leading-snug block">{r.desc}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300">
                      Additional Details (optional)
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Please provide any helpful timestamps, context, or links..."
                      rows={3}
                      maxLength={500}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#1455D9] transition resize-none"
                    />
                    <div className="text-right text-[10px] text-slate-500">{description.length}/500</div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-rose-950/40 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <span>Submitting Report...</span>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit Report</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* Copyright Infringement Notice */
                <form onSubmit={handleSubmitCopyrightNotice} className="space-y-4 text-left">
                  <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-300 leading-relaxed space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Scale className="w-4 h-4 text-indigo-400" />
                      <span>Formal Copyright Takedown Procedure</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Only the legal copyright owner or their authorized representative should submit this notice.
                      Misrepresentations may result in liability.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-300">Claimant Name / Entity *</label>
                      <input
                        type="text"
                        required
                        value={claimantName}
                        onChange={(e) => setClaimantName(e.target.value)}
                        placeholder="e.g. John Doe / Mandatory Records"
                        className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#1455D9]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-300">Contact Email *</label>
                      <input
                        type="email"
                        required
                        value={claimantEmail}
                        onChange={(e) => setClaimantEmail(e.target.value)}
                        placeholder="rights@yourcompany.com"
                        className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#1455D9]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-300">Original Master Title</label>
                    <input
                      type="text"
                      value={originalWorkTitle}
                      onChange={(e) => setOriginalWorkTitle(e.target.value)}
                      placeholder="Title of original song / recording you own"
                      className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#1455D9]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-300">Link to Original Recording or Copyright Proof</label>
                    <input
                      type="url"
                      value={originalWorkProofUrl}
                      onChange={(e) => setOriginalWorkProofUrl(e.target.value)}
                      placeholder="https://audiomack.com/... or https://youtube.com/..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#1455D9]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-300">Description of Infringement</label>
                    <textarea
                      value={infringementDescription}
                      onChange={(e) => setInfringementDescription(e.target.value)}
                      placeholder="Explain how this track infringes your copyrighted composition, master recording, or beat..."
                      rows={2}
                      maxLength={500}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#1455D9] resize-none"
                    />
                  </div>

                  {/* Good Faith Sworn Statement */}
                  <label className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-start gap-2.5 cursor-pointer text-[11px] text-slate-300 select-none">
                    <input
                      type="checkbox"
                      checked={declarationAccepted}
                      onChange={(e) => setDeclarationAccepted(e.target.checked)}
                      className="mt-0.5 rounded text-[#1455D9] focus:ring-[#1455D9]"
                    />
                    <span>
                      I declare under penalty of perjury that I am the copyright owner or authorized agent, and I have a good-faith belief that the disputed use is unauthorized.
                    </span>
                  </label>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting || !declarationAccepted}
                      className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-indigo-950/40 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <span>Filing Takedown Claim...</span>
                      ) : (
                        <>
                          <Scale className="w-3.5 h-3.5" />
                          <span>File Official Copyright Claim</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </>
        )}
      </div>

      <MyReportsModal
        isOpen={showMyReportsModal}
        onClose={() => setShowMyReportsModal(false)}
      />
    </div>
  );
};
