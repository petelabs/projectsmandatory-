import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import {
  subscribeFirestoreNotifications,
  publishNotificationToFirestore,
  markNotificationReadInFirestore,
  deleteNotificationFromFirestore,
  FirestoreNotificationRecord,
} from '../lib/firebase';
import { useAuth } from './AuthContext';

export type NotificationType =
  | 'release'
  | 'download'
  | 'payment'
  | 'subscription'
  | 'account'
  | 'song_approved'
  | 'milestone'
  | 'campaign'
  | 'royalty'
  | 'payout'
  | 'announcement';

export type NotificationCategory = 'listener' | 'artist' | 'system';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  category: NotificationCategory;
  type: NotificationType;
  read: boolean;
  link?: string; // route path e.g. "/song/123" or "/pricing"
}

export interface NotificationPreferences {
  newReleases: boolean;
  downloads: boolean;
  payments: boolean;
  artistMilestones: boolean;
  royalties: boolean;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  preferences: NotificationPreferences;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
  addNotification: (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => Promise<string>;
  updatePreferences: (newPrefs: Partial<NotificationPreferences>) => void;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  newReleases: true,
  downloads: true,
  payments: true,
  artistMilestones: true,
  royalties: true,
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const [preferences, setPreferences] = useState<NotificationPreferences>(() => {
    try {
      const saved = localStorage.getItem('pm_notif_prefs');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_PREFERENCES;
  });

  // Real-time Firestore notifications subscription
  useEffect(() => {
    const unsubscribe = subscribeFirestoreNotifications((records) => {
      const mapped: AppNotification[] = records.map((r) => ({
        id: r.id,
        title: r.title,
        body: r.body,
        timestamp: r.createdAt ? formatRelativeTime(r.createdAt) : 'Recent',
        category: (r.category as NotificationCategory) || 'system',
        type: (r.type as NotificationType) || 'account',
        read: r.read || false,
        link: r.link,
      }));
      setNotifications(mapped);
    }, user?.id);

    return () => unsubscribe();
  }, [user?.id]);

  useEffect(() => {
    try {
      localStorage.setItem('pm_notif_prefs', JSON.stringify(preferences));
    } catch {}
  }, [preferences]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    await markNotificationReadInFirestore(id);
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    notifications.forEach((n) => {
      if (!n.read) {
        markNotificationReadInFirestore(n.id);
      }
    });
  }, [notifications]);

  const deleteNotification = useCallback(async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await deleteNotificationFromFirestore(id);
  }, []);

  const clearAll = useCallback(async () => {
    notifications.forEach((n) => deleteNotificationFromFirestore(n.id));
    setNotifications([]);
  }, [notifications]);

  const addNotification = useCallback(
    async (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>): Promise<string> => {
      const notifId = await publishNotificationToFirestore({
        title: notif.title,
        body: notif.body,
        category: notif.category,
        type: notif.type,
        link: notif.link,
        userId: user?.id || 'ALL',
      });
      return notifId;
    },
    [user?.id]
  );

  const updatePreferences = useCallback((newPrefs: Partial<NotificationPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...newPrefs }));
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        preferences,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        addNotification,
        updatePreferences,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

function formatRelativeTime(dateString: string): string {
  try {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(dateString).toLocaleDateString();
  } catch {
    return 'Recent';
  }
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

