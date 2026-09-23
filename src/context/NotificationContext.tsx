import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';

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
  | 'payout';

export type NotificationCategory = 'listener' | 'artist' | 'system';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  category: NotificationCategory;
  type: NotificationType;
  read: boolean;
  link?: string; // route path e.g. "/song/song-sikono" or "/pricing"
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
  addNotification: (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  updatePreferences: (newPrefs: Partial<NotificationPreferences>) => void;
}

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    title: '🎵 New Track: Sikono (Acoustic Version)',
    body: 'Bwalya Musik just dropped an exclusive acoustic record!',
    timestamp: '10m ago',
    category: 'listener',
    type: 'release',
    read: false,
    link: '/song/song-sikono',
  },
  {
    id: 'notif-2',
    title: '✅ Download Completed: Tiyende',
    body: 'Tiyende by Driemo is now saved in your offline library.',
    timestamp: '2h ago',
    category: 'listener',
    type: 'download',
    read: false,
    link: '/library',
  },
  {
    id: 'notif-3',
    title: '🎉 Royalty Statement Available',
    body: 'Your Q3 2026 stream royalties statement is ready for review in Artist Studio.',
    timestamp: '1d ago',
    category: 'artist',
    type: 'royalty',
    read: true,
    link: '/artist/studio',
  },
  {
    id: 'notif-[#4]',
    title: '💳 Subscription Active',
    body: 'Your Premium Plus plan is active. Enjoy ad-free 320kbps audio & offline downloads.',
    timestamp: '3d ago',
    category: 'listener',
    type: 'subscription',
    read: true,
    link: '/pricing',
  },
  {
    id: 'notif-5',
    title: '⭐ 10,000 Stream Milestone!',
    body: 'Congratulations! Your song "Sikono" crossed 10,000 qualified streams.',
    timestamp: '5d ago',
    category: 'artist',
    type: 'milestone',
    read: true,
    link: '/artist/studio',
  },
];

const DEFAULT_PREFERENCES: NotificationPreferences = {
  newReleases: true,
  downloads: true,
  payments: true,
  artistMilestones: true,
  royalties: true,
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem('pm_notifications');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_NOTIFICATIONS;
  });

  const [preferences, setPreferences] = useState<NotificationPreferences>(() => {
    try {
      const saved = localStorage.getItem('pm_notif_prefs');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_PREFERENCES;
  });

  useEffect(() => {
    try {
      localStorage.setItem('pm_notifications', JSON.stringify(notifications));
    } catch {}
  }, [notifications]);

  useEffect(() => {
    try {
      localStorage.setItem('pm_notif_prefs', JSON.stringify(preferences));
    } catch {}
  }, [preferences]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const addNotification = useCallback((notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: 'Just now',
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  }, []);

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

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
