import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, isAuthorizedAdmin } from '../lib/firebase';

interface AdminContextType {
  isAdminAuthenticated: boolean;
  adminToken: string | null;
  adminEmail: string | null;
  artistName: string;
  loginWithGoogle: () => Promise<string>;
  logout: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    return localStorage.getItem('hapsin_admin_token') || localStorage.getItem('pm_admin_token') || null;
  });
  const [adminEmail, setAdminEmail] = useState<string | null>(() => {
    return localStorage.getItem('hapsin_admin_email') || null;
  });
  const [artistName] = useState<string>('Projects Mandatory');

  // Listen to Firebase Auth state to auto-recognize authorized admins securely
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user && isAuthorizedAdmin(user.email)) {
        const token = `pm_admin_${user.uid}_${Date.now()}`;
        setAdminToken(token);
        setAdminEmail(user.email || null);
        localStorage.setItem('pm_admin_token', token);
        if (user.email) localStorage.setItem('pm_admin_email', user.email);
      } else if (!user && !localStorage.getItem('pm_admin_token')) {
        setAdminToken(null);
        setAdminEmail(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (adminToken) {
      localStorage.setItem('pm_admin_token', adminToken);
      if (adminEmail) localStorage.setItem('pm_admin_email', adminEmail);
    } else {
      localStorage.removeItem('pm_admin_token');
      localStorage.removeItem('hapsin_admin_token');
      localStorage.removeItem('pm_admin_email');
      localStorage.removeItem('hapsin_admin_email');
    }
  }, [adminToken, adminEmail]);

  const loginWithGoogle = async (): Promise<string> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const userEmail = result.user?.email || '';
      
      if (isAuthorizedAdmin(userEmail)) {
        const token = `pm_admin_${result.user.uid}_${Date.now()}`;
        setAdminToken(token);
        setAdminEmail(userEmail);
        localStorage.setItem('pm_admin_token', token);
        localStorage.setItem('pm_admin_email', userEmail);
        return userEmail;
      }

      // If signed in with an unauthorized Google account
      setAdminToken(null);
      setAdminEmail(null);
      throw new Error(
        'Access Denied: The authenticated Google account does not have administrator privileges for Projects Mandatory.'
      );
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        throw new Error('Google sign-in was cancelled. Please try again.');
      }
      throw err;
    }
  };

  const logout = () => {
    setAdminToken(null);
    setAdminEmail(null);
    localStorage.removeItem('pm_admin_token');
    localStorage.removeItem('hapsin_admin_token');
    localStorage.removeItem('pm_admin_email');
    localStorage.removeItem('hapsin_admin_email');
  };

  return (
    <AdminContext.Provider
      value={{
        isAdminAuthenticated: !!adminToken,
        adminToken,
        adminEmail,
        artistName,
        loginWithGoogle,
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
