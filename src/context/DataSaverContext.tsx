import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface DataSaverContextType {
  isDataSaverEnabled: boolean;
  toggleDataSaver: () => void;
  setDataSaver: (enabled: boolean) => void;
}

const DataSaverContext = createContext<DataSaverContextType | undefined>(undefined);

export const DataSaverProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDataSaverEnabled, setIsDataSaverEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('pm_datasaver') === 'true';
    } catch {
      return false;
    }
  });

  const toggleDataSaver = () => {
    setIsDataSaverEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('pm_datasaver', String(next));
      } catch {}
      return next;
    });
  };

  const setDataSaver = (enabled: boolean) => {
    setIsDataSaverEnabled(enabled);
    try {
      localStorage.setItem('pm_datasaver', String(enabled));
    } catch {}
  };

  return (
    <DataSaverContext.Provider
      value={{
        isDataSaverEnabled,
        toggleDataSaver,
        setDataSaver,
      }}
    >
      {children}
    </DataSaverContext.Provider>
  );
};

export function useDataSaver() {
  const context = useContext(DataSaverContext);
  if (!context) {
    throw new Error('useDataSaver must be used within a DataSaverProvider');
  }
  return context;
}
