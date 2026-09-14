import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'neutral' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
}) => {
  const sizeStyles = {
    sm: 'text-[10px] font-semibold px-2 py-0.5 tracking-wider uppercase',
    md: 'text-xs font-semibold px-2.5 py-1',
  };

  // Orange = highlights & promotional accents
  // Green = success / verified
  // Blue = primary trust info
  // Red = urgent / action
  const variantStyles = {
    accent: 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
    primary: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
    secondary: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
    success: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    neutral: 'bg-slate-800/80 text-slate-300 border border-slate-700/60',
    outline: 'bg-transparent text-slate-400 border border-slate-700',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full whitespace-nowrap leading-none ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
