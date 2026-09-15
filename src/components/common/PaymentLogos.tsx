import React from 'react';

/**
 * Official Payment Assets specified for PROJECTS MANDATORY:
 * 1. PayChangu Master Gateway Logo:
 *    https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRrXWu8DX9ntwhkZy227In12WmoHYsYBQ92yeZoGTvz7Q&s=10
 * 2. Unified Payment Methods Picture (Airtel Money, TNM Mpamba, Visa, Mastercard):
 *    https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRILAHhjjnKVmnDZOxobGf-4Hlbp3CgMAamvvdV5T2pw-kciMWcUPfYnA&s
 */

export const PAYCHANGU_LOGO_URL =
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRrXWu8DX9ntwhkZy227In12WmoHYsYBQ92yeZoGTvz7Q&s=10';

export const PAYMENT_METHODS_IMAGE_URL =
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRILAHhjjnKVmnDZOxobGf-4Hlbp3CgMAamvvdV5T2pw-kciMWcUPfYnA&s';

/**
 * PayChangu Gateway Logo Component
 */
export const PayChanguLogo: React.FC<{ className?: string; imgClassName?: string }> = ({
  className = 'h-7',
  imgClassName = 'h-full w-auto object-contain rounded-lg shadow-sm',
}) => (
  <div className={`inline-flex items-center bg-white px-2 py-1 rounded-lg border border-slate-700/50 shadow-sm ${className}`}>
    <img
      src={PAYCHANGU_LOGO_URL}
      alt="PayChangu"
      className={imgClassName}
      referrerPolicy="no-referrer"
      loading="lazy"
    />
  </div>
);

/**
 * Unified Payment Methods Image Component
 * Displays Airtel, TNM Mpamba, Mastercard, and Visa in one authentic verified image.
 */
export const PaymentMethodsBanner: React.FC<{ className?: string; imgClassName?: string }> = ({
  className = 'w-full max-w-sm',
  imgClassName = 'w-full h-auto object-contain rounded-lg',
}) => (
  <div className={`inline-block bg-white p-2 rounded-xl border border-slate-700/60 shadow-md ${className}`}>
    <img
      src={PAYMENT_METHODS_IMAGE_URL}
      alt="Accepted Payment Methods: Airtel Money, TNM Mpamba, Visa, Mastercard"
      className={imgClassName}
      referrerPolicy="no-referrer"
      loading="lazy"
    />
  </div>
);

/**
 * Backward compatibility exports:
 * If individual logos are referenced, they render the unified payment methods image
 */
export const MalawiPaymentMethodsRow: React.FC<{ compact?: boolean }> = ({ compact = false }) => (
  <PaymentMethodsBanner className={compact ? 'max-w-[220px]' : 'max-w-xs'} />
);

export const AirtelMoneyLogo: React.FC<{ className?: string }> = () => (
  <PaymentMethodsBanner className="max-w-[140px] p-1" />
);

export const TnmMpambaLogo: React.FC<{ className?: string }> = () => (
  <PaymentMethodsBanner className="max-w-[140px] p-1" />
);

export const VisaLogo: React.FC<{ className?: string }> = () => (
  <PaymentMethodsBanner className="max-w-[140px] p-1" />
);

export const MastercardLogo: React.FC<{ className?: string }> = () => (
  <PaymentMethodsBanner className="max-w-[140px] p-1" />
);
