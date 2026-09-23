import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { SubscriptionPlan, UserSubscription, SubscriptionTier, MonetizationSettings } from '../types';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';
import { DEFAULT_PLANS, DEFAULT_MONETIZATION_SETTINGS } from '../data/initialData';

interface SubscriptionContextType {
  activeSubscription: UserSubscription | null;
  currentTier: SubscriptionTier;
  plans: SubscriptionPlan[];
  settings: MonetizationSettings;
  isLoading: boolean;
  hasAds: boolean;
  canDownloadOffline: boolean;
  audioQuality: string;
  refreshSubscription: () => Promise<void>;
  subscribeToPlan: (
    tier: SubscriptionTier,
    details: { name: string; email: string; phone: string }
  ) => Promise<{ success: boolean; checkoutUrl?: string; subscription?: UserSubscription; error?: string }>;
  verifyPayment: (txRef: string) => Promise<{ success: boolean; subscription?: UserSubscription; error?: string }>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>(DEFAULT_PLANS);
  const [settings, setSettings] = useState<MonetizationSettings>(DEFAULT_MONETIZATION_SETTINGS);
  const [activeSubscription, setActiveSubscription] = useState<UserSubscription | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load plans and monetization settings
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [fetchedPlans, fetchedSettings] = await Promise.all([
          api.getSubscriptionPlans(),
          api.getMonetizationSettings(),
        ]);
        if (isMounted) {
          if (fetchedPlans && fetchedPlans.length > 0) setPlans(fetchedPlans);
          if (fetchedSettings) setSettings(fetchedSettings);
        }
      } catch (err) {
        console.warn('Subscription settings load notice:', err);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, []);

  // Fetch or sync user subscription
  const refreshSubscription = useCallback(async () => {
    setIsLoading(true);
    try {
      // Check saved subscription in localStorage first
      const savedSubJson = localStorage.getItem('pm_user_subscription');
      if (savedSubJson) {
        try {
          const parsed: UserSubscription = JSON.parse(savedSubJson);
          if (new Date(parsed.expiresAt).getTime() > Date.now()) {
            setActiveSubscription(parsed);
          } else {
            localStorage.removeItem('pm_user_subscription');
          }
        } catch {}
      }

      // Query server for latest authoritative subscription
      if (user?.email || user?.id) {
        const subData = await api.getUserSubscription(user.email, user.id);
        if (subData.subscription && subData.subscription.status === 'ACTIVE') {
          setActiveSubscription(subData.subscription);
          localStorage.setItem('pm_user_subscription', JSON.stringify(subData.subscription));
        }
      }
    } catch (err) {
      console.warn('Subscription fetch notice:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.email, user?.id]);

  useEffect(() => {
    refreshSubscription();
  }, [refreshSubscription]);

  const currentTier: SubscriptionTier = activeSubscription?.status === 'ACTIVE' 
    ? activeSubscription.planTier 
    : 'FREE';

  const hasAds = currentTier === 'FREE';
  const canDownloadOffline = currentTier === 'PREMIUM_PLUS';
  
  const currentPlan = plans.find(p => p.tier === currentTier) || plans[0];
  const audioQuality = currentPlan ? currentPlan.audioQuality : '128kbps Standard Audio';

  const subscribeToPlan = async (
    tier: SubscriptionTier,
    details: { name: string; email: string; phone: string }
  ) => {
    try {
      const res = await api.createSubscriptionCheckout({
        planTier: tier,
        customerName: details.name,
        customerEmail: details.email,
        customerPhone: details.phone,
        userId: user?.id,
      });

      if (res.success && res.isFree) {
        // Free plan instant activation
        setActiveSubscription(res.subscription);
        localStorage.setItem('pm_user_subscription', JSON.stringify(res.subscription));
        return { success: true, subscription: res.subscription };
      }

      return {
        success: res.success,
        checkoutUrl: res.checkoutUrl,
        subscription: res.subscription,
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to initiate checkout.' };
    }
  };

  const verifyPayment = async (txRef: string) => {
    try {
      const res = await api.verifySubscription(txRef);
      if (res.success && res.subscription) {
        setActiveSubscription(res.subscription);
        localStorage.setItem('pm_user_subscription', JSON.stringify(res.subscription));
        return { success: true, subscription: res.subscription };
      }
      return { success: false, error: res.error || 'Payment could not be verified' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Payment verification failed' };
    }
  };

  return (
    <SubscriptionContext.Provider
      value={{
        activeSubscription,
        currentTier,
        plans,
        settings,
        isLoading,
        hasAds,
        canDownloadOffline,
        audioQuality,
        refreshSubscription,
        subscribeToPlan,
        verifyPayment,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
