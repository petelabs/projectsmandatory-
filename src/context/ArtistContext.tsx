import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import {
  ArtistProfile,
  ArtistSongSubmission,
  ArtistSupportTip,
  ArtistPayoutRecord,
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
} from '../lib/firebase';
import { useToast } from './ToastContext';

interface ArtistContextType {
  artistProfile: ArtistProfile | null;
  isArtist: boolean;
  isLoading: boolean;
  submissions: ArtistSongSubmission[];
  tips: ArtistSupportTip[];
  payouts: ArtistPayoutRecord[];
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
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Subscribe to artist profile when user is authenticated
  useEffect(() => {
    if (!user && !firebaseUser) {
      setArtistProfile(null);
      setSubmissions([]);
      setTips([]);
      setPayouts([]);
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

    return () => {
      unsubscribeProfile();
      unsubscribeSubmissions();
      unsubscribeTips();
      unsubscribePayouts();
    };
  }, [user, firebaseUser]);

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
    const uid = firebaseUser?.uid || user?.id;
    const email = firebaseUser?.email || user?.email;
    if (!uid || !email) {
      throw new Error('Please sign in with Google or Email first to create your artist account.');
    }

    const newProfile: ArtistProfile = {
      id: uid,
      userId: uid,
      artistName: data.artistName.trim(),
      email: email.trim().toLowerCase(),
      phone: data.phone.trim(),
      whatsapp: data.whatsapp?.trim() || data.phone.trim(),
      bio: data.bio.trim(),
      genres: data.genres.length > 0 ? data.genres : ['Afro-pop', 'Urban'],
      avatarUrl: data.avatarUrl || user?.avatarUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=600&auto=format&fit=crop',
      bannerUrl: data.bannerUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1600&auto=format&fit=crop',
      payoutDetails: data.payoutDetails,
      wallet: {
        totalEarnedMWK: 0,
        pendingPayoutMWK: 0,
        totalPaidOutMWK: 0,
        totalSongSalesCount: 0,
        totalTipsReceivedMWK: 0,
        totalSupportersCount: 0,
      },
      isVerified: true,
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
    onProgress?: (step: string, percent: number) => void;
  }): Promise<string> => {
    if (!artistProfile) {
      throw new Error('You must have an active artist account to request track uploads.');
    }

    // Hard price limit validation: capped at K5,000 max
    const boundedPrice = Math.min(Math.max(0, Number(data.priceMWK) || 0), 5000);

    let finalAudioUrl = data.audioUrl || '';
    let finalAudioFileName = data.audioFileName || `${data.title}.mp3`;
    let finalFileSize = 'Studio Master';
    let finalFileFormat = '320kbps MP3 Master';

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
    let finalCoverUrl = data.coverUrl || artistProfile.avatarUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop';
    if (data.coverFile) {
      data.onProgress?.('Uploading Cover Artwork...', 60);
      const coverResult = await uploadCoverToStorage(data.coverFile, (percent) => {
        data.onProgress?.(`Uploading Artwork: ${percent}%`, 50 + percent * 0.4);
      });
      finalCoverUrl = coverResult.downloadUrl;
    }

    data.onProgress?.('Submitting track for administrator approval...', 95);

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
        registerArtistProfile,
        updateArtistProfile,
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
