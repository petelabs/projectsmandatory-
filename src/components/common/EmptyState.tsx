import React from 'react';
import { Music, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No songs found',
  description = 'Try adjusting your search criteria or filter to find what you are looking for.',
  actionText,
  onAction,
  icon = <Music className="w-10 h-10 text-slate-500" />,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 my-4 max-w-lg mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-slate-800/80 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-base sm:text-lg font-bold text-slate-100 mb-1">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-400 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};

interface ErrorStateProps {
  title?: string;
  error?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  error = 'Could not load data from the server. Please check your internet connection.',
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl bg-rose-950/20 border border-rose-900/40 my-6 max-w-md mx-auto">
      <div className="w-14 h-14 rounded-2xl bg-rose-900/30 flex items-center justify-center mb-4 text-rose-400">
        <AlertTriangle className="w-7 h-7" />
      </div>
      <h3 className="text-base font-bold text-slate-100 mb-1">{title}</h3>
      <p className="text-xs text-rose-300/80 mb-5 leading-relaxed">{error}</p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Try Again
        </Button>
      )}
    </div>
  );
};
