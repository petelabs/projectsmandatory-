import React from 'react';

export const SongCardSkeleton: React.FC = () => {
  return (
    <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-4 overflow-hidden animate-pulse flex flex-col justify-between">
      <div>
        <div className="aspect-square w-full rounded-xl bg-slate-800 mb-3.5"></div>
        <div className="h-5 bg-slate-800 rounded-md w-3/4 mb-2"></div>
        <div className="h-4 bg-slate-800/70 rounded-md w-1/2 mb-3"></div>
      </div>
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
        <div className="h-6 bg-slate-800 rounded-md w-24"></div>
        <div className="h-10 bg-slate-800 rounded-lg w-28"></div>
      </div>
    </div>
  );
};

export const SongGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, idx) => (
        <SongCardSkeleton key={idx} />
      ))}
    </div>
  );
};
