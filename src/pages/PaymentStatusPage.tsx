import React, { useState, useEffect } from 'react';
import { ShieldCheck, Loader2, CheckCircle2, XCircle, RefreshCw, Smartphone, ArrowRight, Lock } from 'lucide-react';
import { Order } from '../types';
import { api } from '../lib/api';
import { Button } from '../components/common/Button';
import { useToast } from '../context/ToastContext';

interface PaymentStatusPageProps {
  txRef: string;
  onPaymentSuccess: (order: Order, purchaseToken: string) => void;
  onCancel: () => void;
}

export const PaymentStatusPage: React.FC<PaymentStatusPageProps> = ({
  txRef,
  onPaymentSuccess,
  onCancel,
}) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [mobileMoneyStatus, setMobileMoneyStatus] = useState<'waiting_pin' | 'processing' | 'verified' | 'failed'>('waiting_pin');
  const { showToast } = useToast();

  // 1. Fetch initial order state from server
  useEffect(() => {
    let isMounted = true;

    async function loadOrder() {
      try {
        const ord = await api.getOrderByTxRef(txRef);
        if (isMounted) {
          setOrder(ord);
          if (ord.status === 'PAID' && ord.purchaseToken) {
            onPaymentSuccess(ord, ord.purchaseToken);
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Could not fetch order state';
          setVerificationError(msg);
        }
      } finally {
        if (isMounted) {
          setIsVerifying(false);
        }
      }
    }

    loadOrder();

    return () => {
      isMounted = false;
    };
  }, [txRef, onPaymentSuccess]);

  // Server-side verification handler
  const handleVerify = async (isTestSimulate = false) => {
    setIsVerifying(true);
    setVerificationError(null);
    setMobileMoneyStatus('processing');

    try {
      // Call secure server verification endpoint
      const result = await api.verifyPayment({
        txRef,
        mockSuccess: isTestSimulate,
      });

      if (result.verified && result.purchaseToken) {
        setMobileMoneyStatus('verified');
        showToast('Payment verified successfully! Redirecting to download...', 'success');
        setTimeout(() => {
          onPaymentSuccess(result.order, result.purchaseToken);
        }, 1200);
      } else {
        setMobileMoneyStatus('failed');
        setVerificationError('Payment could not be verified by PayChangu. Please ensure payment was authorized on your phone.');
      }
    } catch (err: unknown) {
      setMobileMoneyStatus('failed');
      const msg = err instanceof Error ? err.message : 'Payment verification failed';
      setVerificationError(msg);
      showToast(msg, 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 text-left animate-in fade-in py-4">
      
      {/* Container */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-10 shadow-2xl space-y-6 text-center">
        
        {/* Status Icon */}
        <div className="flex justify-center">
          {mobileMoneyStatus === 'waiting_pin' && (
            <div className="w-16 h-16 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center animate-pulse">
              <Smartphone className="w-8 h-8" />
            </div>
          )}
          {mobileMoneyStatus === 'processing' && (
            <div className="w-16 h-16 rounded-2xl bg-amber-600/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          )}
          {mobileMoneyStatus === 'verified' && (
            <div className="w-16 h-16 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
          )}
          {mobileMoneyStatus === 'failed' && (
            <div className="w-16 h-16 rounded-2xl bg-rose-600/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
              <XCircle className="w-8 h-8" />
            </div>
          )}
        </div>

        {/* Status Headings */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest block">
            Transaction Ref: {txRef}
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white font-['Syne',sans-serif]">
            {mobileMoneyStatus === 'waiting_pin' && 'Awaiting Payment Approval'}
            {mobileMoneyStatus === 'processing' && 'Verifying Payment Server-Side...'}
            {mobileMoneyStatus === 'verified' && 'Payment Verified!'}
            {mobileMoneyStatus === 'failed' && 'Payment Verification Incomplete'}
          </h2>
          <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
            {order ? (
              <>
                Purchasing <strong className="text-white">{order.songTitle}</strong> for{' '}
                <strong className="text-emerald-400">MK {order.amount.toLocaleString()}</strong> via{' '}
                <span className="text-blue-400">{order.paymentMethod.replace('_', ' ')}</span>
              </>
            ) : (
              'Retrieving transaction details...'
            )}
          </p>
        </div>

        {/* Payment Guide Box */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-2.5 text-xs text-slate-300">
          <div className="flex items-center gap-2 font-bold text-white">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>PayChangu Payment Instructions</span>
          </div>
          <ol className="list-decimal pl-4 space-y-1.5 text-slate-400">
            <li>
              Check your mobile phone ({order?.customerPhone || 'registered phone'}) for the PayChangu USSD push prompt.
            </li>
            <li>Enter your Mobile Money PIN to approve the transfer of <strong className="text-white">MK {order?.amount.toLocaleString()}</strong>.</li>
            <li>Once confirmed, click the verification button below to start your download.</li>
          </ol>
        </div>

        {verificationError && (
          <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-200 text-left">
            {verificationError}
          </div>
        )}

        {/* Verification Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            onClick={() => handleVerify(true)}
            disabled={isVerifying}
            className="w-full min-h-[50px] bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-950/60 border border-emerald-500/40 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying with Server...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>I Have Paid — Verify & Start Download</span>
              </>
            )}
          </button>

          <button
            onClick={onCancel}
            disabled={isVerifying}
            className="w-full min-h-[44px] bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition"
          >
            Cancel / Try Different Payment Method
          </button>
        </div>
      </div>
    </div>
  );
};
