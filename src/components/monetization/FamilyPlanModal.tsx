import React, { useState, useEffect } from 'react';
import { Users, X, Plus, Trash2, CheckCircle2, AlertCircle, ShieldCheck, Mail } from 'lucide-react';
import { api } from '../../lib/api';
import { FamilyPlan, FamilyMember, PaymentMethod } from '../../types';

interface FamilyPlanModalProps {
  isOpen: boolean;
  userId: string;
  userEmail: string;
  userName?: string;
  onClose: () => void;
  onPlanUpdated?: () => void;
}

export const FamilyPlanModal: React.FC<FamilyPlanModalProps> = ({
  isOpen,
  userId,
  userEmail,
  userName = 'User',
  onClose,
  onPlanUpdated,
}) => {
  const [hasPlan, setHasPlan] = useState(false);
  const [plan, setPlan] = useState<FamilyPlan | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [userRole, setUserRole] = useState<'OWNER' | 'MEMBER'>('OWNER');
  const [isLoading, setIsLoading] = useState(true);

  // Subscribe flow
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('AIRTEL_MONEY');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Invite member flow
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');

  useEffect(() => {
    if (isOpen && userId) {
      loadFamilyPlan();
    }
  }, [isOpen, userId]);

  const loadFamilyPlan = async () => {
    setIsLoading(true);
    try {
      const res = await api.getFamilyPlan(userId);
      if (res.success) {
        setHasPlan(res.hasFamilyPlan);
        setPlan(res.plan);
        setMembers(res.members || []);
        setUserRole(res.userRole || 'OWNER');
      }
    } catch {
      setHasPlan(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleSubscribeFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await api.subscribeFamilyPlan({
        ownerUserId: userId,
        ownerEmail: userEmail,
        ownerName: userName,
        paymentMethod,
      });

      if (res.success && res.plan) {
        setHasPlan(true);
        setPlan(res.plan);
        setMembers(res.members || []);
        setUserRole('OWNER');
        setSuccessMsg('Family Plan activated! You can now invite up to 5 family members.');
        if (onPlanUpdated) onPlanUpdated();
      } else {
        setErrorMsg(res.error || 'Failed to activate family plan.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Payment initiation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan || !inviteEmail.trim()) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await api.inviteFamilyMember({
        familyPlanId: plan.id,
        memberEmail: inviteEmail.trim(),
        memberName: inviteName.trim() || undefined,
      });

      if (res.success && res.member) {
        setMembers((prev) => [...prev, res.member]);
        setInviteEmail('');
        setInviteName('');
        setSuccessMsg(`Invited ${res.member.memberEmail} successfully!`);
        if (onPlanUpdated) onPlanUpdated();
      } else {
        setErrorMsg(res.error || 'Failed to invite member.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to invite member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!plan) return;
    try {
      const res = await api.removeFamilyMember({
        familyPlanId: plan.id,
        memberId,
      });

      if (res.success) {
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
        setSuccessMsg('Member removed from family plan.');
        if (onPlanUpdated) onPlanUpdated();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to remove member.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-blue-500/30 p-6 sm:p-8 shadow-2xl text-left overflow-y-auto max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">Family Plan</h3>
            <p className="text-xs text-slate-400">
              6 Premium accounts under one single subscription (MK 4,500/mo)
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {isLoading ? (
          <div className="py-12 text-center text-slate-400 text-xs">Loading Family Plan status...</div>
        ) : !hasPlan ? (
          /* Create Family Plan Form */
          <form onSubmit={handleSubscribeFamily} className="space-y-4">
            <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">Family Premium</span>
                <span className="font-mono font-bold text-blue-400 text-sm">MK 4,500 / month</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-1.5 pt-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Up to 6 individual Premium accounts for family members</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Unlimited ad-free music & 320kbps audio quality</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Separate personal playlists and library for each member</span>
                </li>
              </ul>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Select Payment Method
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'AIRTEL_MONEY', name: 'Airtel Money' },
                  { id: 'TNM_MPAMBA', name: 'TNM Mpamba' },
                ].map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      paymentMethod === method.id
                        ? 'bg-blue-600/20 border-blue-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {method.name}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-black text-sm shadow-lg shadow-blue-950/50 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="inline-block animate-spin">⏳</span>
              ) : (
                <>
                  <Users className="w-4 h-4" />
                  <span>Start Family Plan • MK 4,500/mo</span>
                </>
              )}
            </button>
          </form>
        ) : (
          /* Active Family Plan Management */
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block">
                  Family Plan Active
                </span>
                <div className="text-white font-black text-base mt-0.5">
                  {members.length} of {plan?.maxMembers || 6} Slots Used
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">Renews on</span>
                <div className="text-xs text-slate-200 font-mono">
                  {new Date(plan?.expiresAt || '').toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Member List */}
            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Family Members
              </h4>
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 font-bold text-xs flex items-center justify-center">
                        {member.memberName.charAt(0).toUpperCase()}
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                          {member.memberName}
                          {member.role === 'OWNER' && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono">
                              Owner
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">{member.memberEmail}</div>
                      </div>
                    </div>

                    {userRole === 'OWNER' && member.role !== 'OWNER' && (
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
                        title="Remove member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Invite Form (Owner Only) */}
            {userRole === 'OWNER' && (members.length < (plan?.maxMembers || 6)) && (
              <form onSubmit={handleInviteMember} className="pt-2 border-t border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Invite a Family Member
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="family@example.com"
                    className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-blue-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="Name (e.g. Sister)"
                    className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || !inviteEmail.trim()}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>Send Family Invite</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
