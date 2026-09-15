import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Loader2, CheckCircle2, XCircle, RefreshCw, Smartphone, AlertTriangle, ArrowRight, Lock, Home, ArrowLeft } from 'lucide-react';
import { Order } from '../types';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { PayChanguLogo, PaymentMethodsBanner } from '../components/common/PaymentLogos';

interface PaymentStatusPageProps {
  txRef: string;
  onPaymentSuccess: (order: Order, purchaseToken: string) => void;
  onCancel: () => void;
  onNavigateToMusic?: () => void;
}

export const PaymentStatusPage: React.FC<PaymentStatusPageProps> = ({
  txRef,
  onPaymentSuccess,
  onCancel,
  onNavigateToMusic,
}) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const [status, setStatus] = useState<'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED'>('PENDING');
  const [statusMessage, setStatusMessage] = useState<string>('Contacting PayChangu verification gateway...');
  const [apiKeyRequired, setApiKeyRequired] = useState(false);
  const { showToast } = useToast();
  const pollIntervalRef = useRef<any>(null);

  // 1. Initial order load and automatic verification check
  const verifyCurrentTransaction = async (isManual = false) => {
    if (isManual) setIsVerifying(true);

    try {
      const res = await api.verifyPayment({ txRef });
      if (res.order) setOrder(res.order);
      if (res.apiKeyRequired) setApiKeyRequired(true);

      if (res.status === 'PAID' && res.purchaseToken) {
        setStatus('PAID');
        setStatusMessage('Payment verified successfully! Your master recording is ready.');
        showToast('Payment verified successfully!', 'success');
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        setTimeout(() => {
          onPaymentSuccess(res.order, res.purchaseToken!);
        }, 1200);
      } else if (res.status === 'CANCELLED') {
        setStatus('CANCELLED');
        setStatusMessage(res.error || 'Payment was cancelled by the user. No money was charged.');
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      } else if (res.status === 'FAILED') {
        setStatus('FAILED');
        setStatusMessage(res.error || 'Payment was declined or failed at PayChangu. Please try again.');
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      } else {
        setStatus('PENDING');
        if (res.error && !res.apiKeyRequired) {
          setStatusMessage(res.error);
        } else if (res.apiKeyRequired) {
          setStatusMessage('PAYCHANGU_SECRET_KEY is pending configuration on the server. Add your secret key to complete live verification.');
        } else {
          setStatusMessage('Awaiting confirmation from your Airtel Money / TNM Mpamba phone or Card...');
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error connecting to payment gateway';
      setStatusMessage(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Load order info first
    api.getOrderByTxRef(txRef)
      .then((ord) => {
        if (isMounted) {
          setOrder(ord);
          if (ord.status === 'PAID' && ord.purchaseToken) {
            setStatus('PAID');
            onPaymentSuccess(ord, ord.purchaseToken);
            return;
          }
        }
        // Run initial verification
        verifyCurrentTransaction();
      })
      .catch(() => {
        verifyCurrentTransaction();
      });

    // Auto-polling every 5 seconds if pending
    pollIntervalRef.current = setInterval(() => {
      if (status === 'PENDING') {
        verifyCurrentTransaction(false);
      }
    }, 5000);

    return () => {
      isMounted = false;
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [txRef]);

  return (
    <div className="max-w-xl mx-auto space-y-6 text-left animate-in fade-in py-4">
      
      {/* Container */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-10 shadow-2xl space-y-6 text-center">
        
        {/* Header Badge */}
        <div className="flex items-center justify-center gap-2">
          <PayChanguLogo className="h-6" />
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest block">
            • Ref: {txRef}
          </span>
        </div>

        {/* Status Icon */}
        <div className="flex justify-center pt-2">
          {status === 'PENDING' && (
            <div className="w-16 h-16 rounded-2xl bg-teal-600/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          )}

          {status === 'PAID' && (
            <div className="w-16 h-16 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
          )}

          {status === 'CANCELLED' && (
            <div className="w-16 h-16 rounded-2xl bg-amber-600/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8" />
            </div>
          )}

          {status === 'FAILED' && (
            <div className="w-16 h-16 rounded-2xl bg-rose-600/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
              <XCircle className="w-8 h-8" />
            </div>
          )}
        </div>

        {/* Status Headings */}
        <div className="space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-extrabold text-white font-['Syne',sans-serif]">
            {status === 'PENDING' && 'Waiting For Payment Approval'}
            {status === 'PAID' && 'Payment Verified & Complete!'}
            {status === 'CANCELLED' && 'Payment Cancelled'}
            {status === 'FAILED' && 'Payment Failed or Declined'}
          </h2>
          
          <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
            {order ? (
              <>
                Purchasing <strong className="text-white">{order.songTitle}</strong> for{' '}
                <strong className="text-emerald-400 font-mono">MK {order.amount.toLocaleString()}</strong> via{' '}
                <span className="text-teal-400 font-semibold">PayChangu</span>
              </>
            ) : (
              'Checking transaction details...'
            )}
          </p>
        </div>

        {/* ===================================================
            1. CANCELLED STATE VIEW
            =================================================== */}
        {status === 'CANCELLED' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/60 text-left space-y-2 text-xs text-amber-200">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Transaction Was Cancelled</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                The payment was cancelled and <strong className="text-white">no money was deducted</strong> from your account. You can retry paying whenever you are ready, try a different mobile number/card, or return to the catalog.
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                onClick={onCancel}
                className="w-full min-h-[50px] bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-rose-950/60 border border-rose-500/40 flex items-center justify-center gap-2 transition"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Payment Again with PayChangu</span>
              </button>

              {onNavigateToMusic && (
                <button
                  onClick={onNavigateToMusic}
                  className="w-full min-h-[44px] bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center justify-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  <span>Return to Music Catalog</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* ===================================================
            2. FAILED STATE VIEW
            =================================================== */}
        {status === 'FAILED' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-left space-y-2 text-xs text-rose-200">
              <div className="flex items-center gap-2 font-bold text-rose-300">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Transaction Not Completed</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                {statusMessage}
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                onClick={onCancel}
                className="w-full min-h-[50px] bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-rose-950/60 border border-rose-500/40 flex items-center justify-center gap-2 transition"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Again with PayChangu</span>
              </button>
            </div>
          </div>
        )}

        {/* ===================================================
            3. PENDING STATE VIEW (Real Payment Instructions)
            =================================================== */}
        {status === 'PENDING' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-3 text-xs text-slate-300">
              <div className="flex items-center gap-2 font-bold text-white">
                <Smartphone className="w-4 h-4 text-teal-400" />
                <span>Complete Authorization on Your Device:</span>
              </div>
              
              <ol className="list-decimal pl-4 space-y-2 text-slate-400">
                <li>
                  Check your phone ({order?.customerPhone || 'registered number'}) for the <strong className="text-white">Airtel Money / TNM Mpamba PIN prompt</strong> or card 3DS security code.
                </li>
                <li>
                  Enter your secret PIN to authorize the payment of <strong className="text-emerald-400 font-mono">MK {order?.amount.toLocaleString()}</strong>.
                </li>
                <li>
                  Once confirmed, click the check button below or wait for automatic verification.
                </li>
              </ol>

              {/* Supported Payment Channels */}
              <div className="pt-2 border-t border-slate-800/80">
                <PaymentMethodsBanner className="w-full max-w-xs" />
              </div>
            </div>

            {apiKeyRequired && (
              <div className="p-3.5 rounded-xl bg-blue-950/50 border border-blue-800/60 text-xs text-blue-200 text-left space-y-1">
                <span className="font-bold block text-white">API Integration Notice:</span>
                <p className="text-slate-300">
                  To verify live payments in production, set <code className="bg-slate-900 px-1 py-0.5 rounded text-teal-300 font-mono">PAYCHANGU_SECRET_KEY</code> in your environment variables.
                </p>
              </div>
            )}

            {/* Manual Check Button & Cancel */}
            <div className="space-y-3 pt-2">
              <button
                onClick={() => verifyCurrentTransaction(true)}
                disabled={isVerifying}
                className="w-full min-h-[50px] bg-teal-600 hover:bg-teal-500 active:scale-[0.98] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-teal-950/60 border border-teal-500/40 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Checking PayChangu Status...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>I Have Approved on My Phone — Check Status</span>
                  </>
                )}
              </button>

              <button
                onClick={onCancel}
                disabled={isVerifying}
                className="w-full min-h-[44px] bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Cancel / Change Details</span>
              </button>
            </div>
          </div>
        )}

        {/* ===================================================
            4. PAID STATE VIEW
            =================================================== */}
        {status === 'PAID' && (
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-200 space-y-2">
            <span className="font-bold text-white text-sm block">Success! Your payment was verified.</span>
            <p className="text-slate-300">
              Generating your secure audio download license...
            </p>
          </div>
        )}

      </div>
    </div>
  );
};
