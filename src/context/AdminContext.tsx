import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../lib/api';

interface AdminContextType {
  isAdminAuthenticated: boolean;
  adminToken: string | null;
  artistName: string;
  login: (password: string) => Promise<void>;
  logout: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    return localStorage.getItem('pm_admin_token') || null;
  });
  const [artistName, setArtistName] = useState<string>('PROJECTS MANDATORY');

  useEffect(() => {
    if (adminToken) {
      localStorage.setItem('pm_admin_token', adminToken);
    } else {
      localStorage.removeItem('pm_admin_token');
    }
  }, [adminToken]);

  const login = async (password: string) => {
    const res = await api.admin.login(password);
    setAdminToken(res.token);
    if (res.artistName) {
      setArtistName(res.artistName);
    }
  };

  const logout = () => {
    setAdminToken(null);
  };

  return (
    <AdminContext.Provider
      value={{
        isAdminAuthenticated: !!adminToken,
        adminToken,
        artistName,
        login,
        logout,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
