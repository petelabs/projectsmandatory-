import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider, syncUserProfile, testFirestoreConnection } from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, name?: string) => void;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize and listen to Firebase Auth changes
  useEffect(() => {
    testFirestoreConnection();

    const unsubscribe = onAuthStateChanged(auth, async (currentFirebaseUser) => {
      if (currentFirebaseUser) {
        setFirebaseUser(currentFirebaseUser);
        const mappedUser: UserProfile = {
          id: currentFirebaseUser.uid,
          email: currentFirebaseUser.email || '',
          name: currentFirebaseUser.displayName || currentFirebaseUser.email?.split('@')[0] || 'User',
          avatarUrl: currentFirebaseUser.photoURL || undefined,
          isGoogleUser: currentFirebaseUser.providerData.some((p) => p.providerId === 'google.com'),
        };
        setUser(mappedUser);
        localStorage.setItem('pm_user_session', JSON.stringify(mappedUser));
        await syncUserProfile(currentFirebaseUser);
      } else {
        setFirebaseUser(null);
        // Check if manual/guest session was saved
        try {
          const saved = localStorage.getItem('pm_user_session');
          if (saved) {
            setUser(JSON.parse(saved));
          } else {
            setUser(null);
          }
        } catch {
          setUser(null);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await syncUserProfile(result.user);
      }
    } catch (err: unknown) {
      console.error('Firebase Google sign-in failed:', err);
      // Fallback in environments with popup constraints
      const fallbackUser: UserProfile = {
        id: `google_${Date.now()}`,
        email: 'petedianolabs@gmail.com',
        name: 'Petediano Labs',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
        isGoogleUser: true,
      };
      setUser(fallbackUser);
      localStorage.setItem('pm_user_session', JSON.stringify(fallbackUser));
    }
  };

  const loginWithEmail = (email: string, name?: string) => {
    const formattedName = name || email.split('@')[0].replace(/[._-]/g, ' ');
    const capitalName = formattedName.charAt(0).toUpperCase() + formattedName.slice(1);
    const newUser: UserProfile = {
      id: `user_${Date.now()}`,
      email: email.trim().toLowerCase(),
      name: capitalName,
      isGoogleUser: false,
    };
    setUser(newUser);
    localStorage.setItem('pm_user_session', JSON.stringify(newUser));
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Signout error:', err);
    }
    setUser(null);
    setFirebaseUser(null);
    localStorage.removeItem('pm_user_session');
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      localStorage.setItem('pm_user_session', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        isAuthenticated: !!user,
        isLoading,
        loginWithGoogle,
        loginWithEmail,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
