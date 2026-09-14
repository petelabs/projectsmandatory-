import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed select-none rounded-lg tracking-wide active:scale-[0.98]';

  // Size hierarchy (ensuring min 44px touch target on mobile)
  const sizeStyles = {
    sm: 'min-h-[38px] px-3 py-1.5 text-xs gap-1.5',
    md: 'min-h-[44px] px-4 py-2 text-sm gap-2',
    lg: 'min-h-[50px] px-6 py-3 text-base gap-2.5',
  };

  // Brand color hierarchy:
  // Red = strong CTA/action & Buy
  // Blue = primary brand/navigation
  // Green = success
  // Orange = accent/highlight
  const variantStyles = {
    primary: 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/40 focus-visible:ring-rose-500 border border-rose-500/30',
    secondary: 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-950/40 focus-visible:ring-blue-500 border border-blue-500/30',
    accent: 'bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-950/40 focus-visible:ring-orange-500 border border-orange-500/30',
    success: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40 focus-visible:ring-emerald-500 border border-emerald-500/30',
    outline: 'bg-slate-900/60 hover:bg-slate-800/80 text-slate-200 border border-slate-700 hover:border-slate-500 focus-visible:ring-slate-400',
    danger: 'bg-red-700 hover:bg-red-600 text-white focus-visible:ring-red-500',
    ghost: 'bg-transparent hover:bg-slate-800/60 text-slate-300 hover:text-white focus-visible:ring-slate-400',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {!isLoading && leftIcon}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
};
