import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import {
  ArtistProfile,
  ArtistSongSubmission,
  ArtistSupportTip,
  ArtistPayoutRecord,
  BoostReferral,
  ArtistVerificationDetails,
} from '../types';
import {
  saveArtistProfileToFirestore,
  subscribeArtistProfile,
  submitArtistSongSubmission,
  subscribeArtistSubmissions,
  subscribeArtistTips,
  subscribeArtistPayouts,
  uploadAudioToStorage,
  uploadCoverToStorage,
  requestArtistVerification,
  markArtistNotificationRead,
  publishSongDirectly,
  subscribeArtistBoostReferrals,
} from '../lib/firebase';
import { useToast } from './ToastContext';

interface ArtistContextType {
  artistProfile: ArtistProfile | null;
  isArtist: boolean;
  isLoading: boolean;
  submissions: ArtistSongSubmission[];
  tips: ArtistSupportTip[];
  payouts: ArtistPayoutRecord[];
  boostReferrals: BoostReferral[];
  registerArtistProfile: (data: {
    artistName: string;
    phone: string;
    whatsapp?: string;
    bio: string;
    genres: string[];
    avatarUrl?: string;
    bannerUrl?: string;
    payoutDetails: {
      accountType: 'AIRTEL_MONEY' | 'TNM_MPAMBA' | 'BANK';
      accountNumber: string;
      accountName: string;
      bankName?: string;
    };
  }) => Promise<void>;
  updateArtistProfile: (updates: Partial<ArtistProfile>) => Promise<void>;
  requestVerification: (details: ArtistVerificationDetails) => Promise<void>;
  markNotificationAsRead: (notifId: string) => Promise<void>;
  createSongBoostLink: (songId?: string) => string;
  submitSongUpload: (data: {
    title: string;
    featuredArtists?: string;
    genre: string;
    releaseDate: string;
    priceMWK: number;
    description: string;
    lyrics?: string;
    audioFile?: File;
    audioUrl?: string;
    audioFileName?: string;
    coverFile?: File;
    coverUrl?: string;
    publishDirectly?: boolean;
    onProgress?: (step: string, percent: number) => void;
  }) => Promise<string>;
}

const ArtistContext = createContext<ArtistContextType | undefined>(undefined);

export const ArtistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, firebaseUser } = useAuth();
  const { showToast } = useToast();
  const [artistProfile, setArtistProfile] = useState<ArtistProfile | null>(null);
  const [submissions, setSubmissions] = useState<ArtistSongSubmission[]>([]);
  const [tips, setTips] = useState<ArtistSupportTip[]>([]);
  const [payouts, setPayouts] = useState<ArtistPayoutRecord[]>([]);
  const [boostReferrals, setBoostReferrals] = useState<BoostReferral[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Subscribe to artist profile when user is authenticated
  useEffect(() => {
    if (!user && !firebaseUser) {
      setArtistProfile(null);
      setSubmissions([]);
      setTips([]);
      setPayouts([]);
      setBoostReferrals([]);
      setIsLoading(false);
      return;
    }

    const currentUid = firebaseUser?.uid || user?.id;
    if (!currentUid) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribeProfile = subscribeArtistProfile(currentUid, (profile) => {
      setArtistProfile(profile);
      setIsLoading(false);
    });

    const unsubscribeSubmissions = subscribeArtistSubmissions(currentUid, (subs) => {
      setSubmissions(subs);
    });

    const unsubscribeTips = subscribeArtistTips(currentUid, (artistTips) => {
      setTips(artistTips);
    });

    const unsubscribePayouts = subscribeArtistPayouts(currentUid, (artistPayouts) => {
      setPayouts(artistPayouts);
    });

    const unsubscribeBoost = subscribeArtistBoostReferrals(currentUid, (referrals) => {
      setBoostReferrals(referrals);
    });

    return () => {
      unsubscribeProfile();
      unsubscribeSubmissions();
      unsubscribeTips();
      unsubscribePayouts();
      unsubscribeBoost();
    };
  }, [user?.id, firebaseUser?.uid]);

  const registerArtistProfile = async (data: {
    artistName: string;
    phone: string;
    whatsapp?: string;
    bio: string;
    genres: string[];
    avatarUrl?: string;
    bannerUrl?: string;
    payoutDetails: {
      accountType: 'AIRTEL_MONEY' | 'TNM_MPAMBA' | 'BANK';
      accountNumber: string;
      accountName: string;
      bankName?: string;
    };
  }) => {
    const currentUid = firebaseUser?.uid || user?.id;
    if (!currentUid) {
      throw new Error('You must be signed in with Google or an account to register an artist profile.');
    }

    const newProfile: ArtistProfile = {
      id: currentUid,
      userId: currentUid,
      artistName: data.artistName.trim(),
      email: firebaseUser?.email || user?.email || '',
      phone: data.phone.trim(),
      whatsapp: data.whatsapp?.trim() || data.phone.trim(),
      bio: data.bio.trim() || 'Independent artist on Projects Mandatory.',
      genres: data.genres,
      avatarUrl:
        data.avatarUrl ||
        user?.avatarUrl ||
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=400&auto=format&fit=crop',
      bannerUrl:
        data.bannerUrl ||
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200&auto=format&fit=crop',
      payoutDetails: data.payoutDetails,
      wallet: {
        totalEarnedMWK: 0,
        pendingPayoutMWK: 0,
        totalPaidOutMWK: 0,
        totalSongSalesCount: 0,
        totalTipsReceivedMWK: 0,
        totalSupportersCount: 0,
      },
      isVerified: false,
      verificationStatus: 'UNVERIFIED',
      referralStats: {
        totalReferralClicks: 0,
        totalReferralPlays: 0,
        totalReferralPurchases: 0,
        totalReferralRevenueMWK: 0,
      },
      analytics: {
        totalPlays: 0,
        totalPageViews: 0,
      },
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveArtistProfileToFirestore(newProfile);
    setArtistProfile(newProfile);
    showToast(`Artist account for "${data.artistName}" successfully created!`, 'success');
  };

  const updateArtistProfile = async (updates: Partial<ArtistProfile>) => {
    if (!artistProfile) throw new Error('No active artist profile found.');
    const updated = {
      ...artistProfile,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await saveArtistProfileToFirestore(updated);
    setArtistProfile(updated);
    showToast('Artist profile updated successfully.', 'success');
  };

  const requestVerification = async (details: ArtistVerificationDetails) => {
    if (!artistProfile) throw new Error('No artist profile found.');
    await requestArtistVerification(artistProfile.id, details);
    setArtistProfile((prev) =>
      prev
        ? {
            ...prev,
            verificationStatus: 'PENDING_VERIFICATION',
            verificationRequestedAt: new Date().toISOString(),
            verificationDetails: details,
          }
        : null
    );
    showToast('Verification request submitted to Admin Dashboard for review!', 'success');
  };

  const markNotificationAsRead = async (notifId: string) => {
    if (!artistProfile) return;
    await markArtistNotificationRead(artistProfile.id, notifId);
    setArtistProfile((prev) => {
      if (!prev || !prev.notifications) return prev;
      return {
        ...prev,
        notifications: prev.notifications.map((n) =>
          n.id === notifId ? { ...n, read: true } : n
        ),
      };
    });
  };

  const createSongBoostLink = (songId?: string) => {
    const origin = window.location.origin;
    const artistId = artistProfile?.id || '';
    if (songId) {
      return `${origin}/song/${songId}?ref=${artistId}&boost=1`;
    }
    return `${origin}/?artist=${artistId}&ref=${artistId}&boost=1`;
  };

  const submitSongUpload = async (data: {
    title: string;
    featuredArtists?: string;
    genre: string;
    releaseDate: string;
    priceMWK: number;
    description: string;
    lyrics?: string;
    audioFile?: File;
    audioUrl?: string;
    audioFileName?: string;
    coverFile?: File;
    coverUrl?: string;
    publishDirectly?: boolean;
    onProgress?: (step: string, percent: number) => void;
  }): Promise<string> => {
    if (!artistProfile) {
      throw new Error('You must have an active artist account to upload tracks.');
    }

    // Hard price limit validation: capped at K5,000 max
    const boundedPrice = Math.min(Math.max(0, Number(data.priceMWK) || 0), 5000);
    const artistShareMWK = Math.round(boundedPrice * 0.7);
    const platformShareMWK = boundedPrice - artistShareMWK;

    let finalAudioUrl = data.audioUrl || '';
    let finalAudioFileName = data.audioFileName || `${data.title}.mp3`;
    let finalFileSize = '10.2 MB';
    let finalFileFormat = '320kbps MP3 + WAV Master';

    // 1. Upload audio if file present
    if (data.audioFile) {
      data.onProgress?.('Uploading Studio Audio Master...', 10);
      const audioResult = await uploadAudioToStorage(data.audioFile, (percent) => {
        data.onProgress?.(`Uploading Audio: ${percent}%`, percent * 0.5);
      });
      finalAudioUrl = audioResult.downloadUrl;
      finalAudioFileName = audioResult.fileName;
      finalFileSize = audioResult.fileSize;
      finalFileFormat = audioResult.fileFormat;
    }

    // 2. Upload cover if file present
    let finalCoverUrl =
      data.coverUrl ||
      artistProfile.avatarUrl ||
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop';
    if (data.coverFile) {
      data.onProgress?.('Uploading Cover Artwork...', 60);
      const coverResult = await uploadCoverToStorage(data.coverFile, (percent) => {
        data.onProgress?.(`Uploading Artwork: ${percent}%`, 50 + percent * 0.4);
      });
      finalCoverUrl = coverResult.downloadUrl;
    }

    // 3. Direct publishing for verified artists
    const canPublishDirectly = artistProfile.isVerified === true || data.publishDirectly;

    if (canPublishDirectly) {
      data.onProgress?.('Publishing directly to Projects Mandatory live store...', 90);
      const publishedSongId = await publishSongDirectly({
        artistId: artistProfile.id,
        artistName: artistProfile.artistName,
        artistEmail: artistProfile.email,
        artistPhone: artistProfile.phone,
        title: data.title.trim(),
        featuredArtists: data.featuredArtists?.trim() || '',
        genre: data.genre.trim() || 'Afro-fusion',
        releaseDate: data.releaseDate || new Date().toISOString().split('T')[0],
        priceMWK: boundedPrice,
        artistShareMWK,
        platformShareMWK,
        coverImage: finalCoverUrl,
        audioFilePath: finalAudioUrl,
        audioFileName: finalAudioFileName,
        fileSize: finalFileSize,
        fileFormat: finalFileFormat,
        streamUrl: finalAudioUrl,
        description: data.description.trim() || `Studio single by ${artistProfile.artistName}`,
        lyrics: data.lyrics?.trim() || '',
      });
      data.onProgress?.('Track published live to store!', 100);
      showToast(`🎉 "${data.title}" is published live! Direct verified posting complete.`, 'success');
      return publishedSongId;
    }

    // Otherwise, submit to Admin review queue
    data.onProgress?.('Submitting track for administrator verification...', 95);

    const submissionId = await submitArtistSongSubmission({
      artistId: artistProfile.id,
      artistName: artistProfile.artistName,
      artistEmail: artistProfile.email,
      artistPhone: artistProfile.phone,
      title: data.title.trim(),
      featuredArtists: data.featuredArtists?.trim() || '',
      genre: data.genre.trim() || 'Afro-fusion',
      releaseDate: data.releaseDate || new Date().toISOString().split('T')[0],
      priceMWK: boundedPrice,
      coverImage: finalCoverUrl,
      audioFilePath: finalAudioUrl,
      audioFileName: finalAudioFileName,
      fileSize: finalFileSize,
      fileFormat: finalFileFormat,
      streamUrl: finalAudioUrl,
      description: data.description.trim() || `Studio single by ${artistProfile.artistName}`,
      lyrics: data.lyrics?.trim() || '',
    });

    data.onProgress?.('Track submitted successfully!', 100);
    showToast(`"${data.title}" submitted to admin for verification and storefront publishing!`, 'success');
    return submissionId;
  };

  return (
    <ArtistContext.Provider
      value={{
        artistProfile,
        isArtist: !!artistProfile,
        isLoading,
        submissions,
        tips,
        payouts,
        boostReferrals,
        registerArtistProfile,
        updateArtistProfile,
        requestVerification,
        markNotificationAsRead,
        createSongBoostLink,
        submitSongUpload,
      }}
    >
      {children}
    </ArtistContext.Provider>
  );
};

export function useArtist() {
  const context = useContext(ArtistContext);
  if (!context) {
    throw new Error('useArtist must be used within an ArtistProvider');
  }
  return context;
}
