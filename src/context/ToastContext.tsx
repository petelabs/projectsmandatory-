import React, { createContext, useContext, useState, ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-lg shadow-xl text-sm font-medium border transition-all animate-in fade-in slide-in-from-bottom-2 ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-800/80 shadow-emerald-950/40'
                : toast.type === 'error'
                ? 'bg-rose-950/90 text-rose-200 border-rose-800/80 shadow-rose-950/40'
                : toast.type === 'warning'
                ? 'bg-amber-950/90 text-amber-200 border-amber-800/80 shadow-amber-950/40'
                : 'bg-slate-900/95 text-slate-100 border-slate-700/80 shadow-black/50'
            }`}
          >
            <div className="flex items-center gap-2">
              {toast.type === 'success' && (
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
              )}
              {toast.type === 'error' && (
                <span className="h-2 w-2 rounded-full bg-rose-400"></span>
              )}
              {toast.type === 'warning' && (
                <span className="h-2 w-2 rounded-full bg-amber-400"></span>
              )}
              {toast.type === 'info' && (
                <span className="h-2 w-2 rounded-full bg-blue-400"></span>
              )}
              <p className="leading-snug">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white text-xs p-1"
              aria-label="Close notification"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
