import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  onSnapshot,
  getDocFromServer,
  Unsubscribe,
  increment,
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  Song,
  Order,
  ArtistSettings,
  UserProfile,
  MusicPromotionRequest,
  ContactMessage,
  ArtistProfile,
  ArtistSongSubmission,
  ArtistSupportTip,
  ArtistPayoutRecord,
} from '../types';
import { INITIAL_ARTIST_SETTINGS } from '../data/initialData';

// Official Contact WhatsApp Details (0984 67 96 91)
export const OFFICIAL_WHATSAPP_NUMBER = '0984 67 96 91';
export const OFFICIAL_WHATSAPP_LINK = 'https://wa.me/265984679691';

// Authorized Google Admin Accounts (Guarded securely on server/client without displaying in UI)
export const AUTHORIZED_ADMIN_EMAILS: readonly string[] = [
  'alwaysgoodone265@gmail.com',
  'petedianolabs@gmail.com',
];

export function isAuthorizedAdmin(email?: string | null): boolean {
  if (!email) return false;
  return AUTHORIZED_ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

// Initialize Firebase App singleton
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Auth, Firestore & Cloud Storage instances
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Connection testing helper
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, '_connection_test', 'health'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore is connecting...');
    }
  }
}

// User Profile sync helper
export async function syncUserProfile(user: FirebaseUser) {
  try {
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    const isAdmin = isAuthorizedAdmin(user.email);

    if (!snap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        name: user.displayName || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        photoURL: user.photoURL || '',
        role: isAdmin ? 'admin' : 'customer',
        createdAt: new Date().toISOString(),
      });
    } else if (isAdmin) {
      await updateDoc(userRef, { role: 'admin' });
    }
  } catch (err) {
    console.error('Error syncing user profile to Firestore:', err);
  }
}

// ==========================================
// REAL-TIME FIRESTORE DATABASE HELPERS: SONGS
// ==========================================

// 1. Subscribe to published songs (Real-time listener for public storefront)
export function subscribePublishedSongs(
  callback: (songs: Song[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const songsCol = collection(db, 'songs');
  return onSnapshot(
    songsCol,
    (snapshot) => {
      if (snapshot.empty) {
        callback([]);
        return;
      }
      const songs: Song[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Song;
        if (data.isPublished !== false) {
          songs.push({ ...data, id: docSnap.id });
        }
      });
      // Sort: latest first
      songs.sort((a, b) => new Date(b.releaseDate || b.createdAt || 0).getTime() - new Date(a.releaseDate || a.createdAt || 0).getTime());
      callback(songs);
    },
    (err) => {
      console.warn('Firestore real-time subscription note:', err.message);
      if (onError) onError(err);
    }
  );
}

// 2. Subscribe to all songs (for Admin Dashboard)
export function subscribeAllSongs(
  callback: (songs: Song[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const songsCol = collection(db, 'songs');
  return onSnapshot(
    songsCol,
    (snapshot) => {
      const songs: Song[] = [];
      snapshot.forEach((docSnap) => {
        songs.push({ ...(docSnap.data() as Song), id: docSnap.id });
      });
      songs.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      callback(songs);
    },
    (err) => {
      console.warn('Firestore admin songs subscription note:', err.message);
      if (onError) onError(err);
    }
  );
}

// 3. Create or update song in Firestore
export async function saveSongToFirestore(song: Song): Promise<void> {
  const songRef = doc(db, 'songs', song.id);
  const price = Math.min(Math.max(0, song.priceMWK || 0), 5000); // Cap at MK 5,000 max
  const artistShare = Math.round(price * 0.7); // 70% to artist
  const platformShare = price - artistShare; // 30% to platform

  await setDoc(songRef, {
    ...song,
    priceMWK: price,
    artistShareMWK: artistShare,
    platformShareMWK: platformShare,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
}

// 4. Delete song from Firestore
export async function deleteSongFromFirestore(songId: string): Promise<void> {
  const songRef = doc(db, 'songs', songId);
  await deleteDoc(songRef);
}

// ==========================================
// ARTIST PROFILES & CREATOR ACCOUNTS
// ==========================================

export async function saveArtistProfileToFirestore(profile: ArtistProfile): Promise<void> {
  const artistRef = doc(db, 'artists', profile.id);
  await setDoc(artistRef, {
    ...profile,
    updatedAt: new Date().toISOString(),
  }, { merge: true });

  // Also update user profile with artist link
  if (profile.userId) {
    const userRef = doc(db, 'users', profile.userId);
    await setDoc(userRef, {
      isArtist: true,
      artistId: profile.id,
      name: profile.artistName,
    }, { merge: true });
  }
}

export async function getArtistProfileFromFirestore(artistId: string): Promise<ArtistProfile | null> {
  try {
    const artistRef = doc(db, 'artists', artistId);
    const snap = await getDoc(artistRef);
    if (snap.exists()) {
      return { ...(snap.data() as ArtistProfile), id: snap.id };
    }
    return null;
  } catch (err) {
    console.warn('Get artist profile note:', err);
    return null;
  }
}

export function subscribeArtistProfile(
  artistId: string,
  callback: (profile: ArtistProfile | null) => void
): Unsubscribe {
  const artistRef = doc(db, 'artists', artistId);
  return onSnapshot(artistRef, (snap) => {
    if (snap.exists()) {
      callback({ ...(snap.data() as ArtistProfile), id: snap.id });
    } else {
      callback(null);
    }
  });
}

export function subscribeAllArtists(
  callback: (artists: ArtistProfile[]) => void
): Unsubscribe {
  const artistsCol = collection(db, 'artists');
  return onSnapshot(artistsCol, (snapshot) => {
    const list: ArtistProfile[] = [];
    snapshot.forEach((d) => {
      list.push({ ...(d.data() as ArtistProfile), id: d.id });
    });
    list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    callback(list);
  });
}

// ==========================================
// ARTIST SONG SUBMISSIONS & APPROVAL PIPELINE
// ==========================================

// Submit a track for admin approval (Price capped <= 5,000 MWK, 70/30 split enforced)
export async function submitArtistSongSubmission(
  submissionData: Omit<ArtistSongSubmission, 'id' | 'createdAt' | 'status' | 'artistShareMWK' | 'platformShareMWK'>
): Promise<string> {
  const submissionId = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const subDoc = doc(db, 'artistSubmissions', submissionId);

  const price = Math.min(Math.max(0, submissionData.priceMWK || 0), 5000); // 5000 MWK cap
  const artistShare = Math.round(price * 0.7); // 70% to artist
  const platformShare = price - artistShare; // 30% platform

  const payload: ArtistSongSubmission = {
    ...submissionData,
    id: submissionId,
    priceMWK: price,
    artistShareMWK: artistShare,
    platformShareMWK: platformShare,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  };

  await setDoc(subDoc, payload);
  return submissionId;
}

// Subscribe to an artist's personal submissions
export function subscribeArtistSubmissions(
  artistId: string,
  callback: (submissions: ArtistSongSubmission[]) => void
): Unsubscribe {
  const subCol = collection(db, 'artistSubmissions');
  const q = query(subCol, where('artistId', '==', artistId));
  return onSnapshot(q, (snapshot) => {
    const list: ArtistSongSubmission[] = [];
    snapshot.forEach((d) => {
      list.push({ ...(d.data() as ArtistSongSubmission), id: d.id });
    });
    list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    callback(list);
  });
}

// Subscribe to all artist submissions (for Admin Dashboard)
export function subscribeAllSongSubmissions(
  callback: (submissions: ArtistSongSubmission[]) => void
): Unsubscribe {
  const subCol = collection(db, 'artistSubmissions');
  return onSnapshot(subCol, (snapshot) => {
    const list: ArtistSongSubmission[] = [];
    snapshot.forEach((d) => {
      list.push({ ...(d.data() as ArtistSongSubmission), id: d.id });
    });
    list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    callback(list);
  });
}

// Approve artist submission and publish directly to main catalog
export async function approveAndPublishSong(
  submission: ArtistSongSubmission,
  finalPriceMWK?: number
): Promise<string> {
  const price = Math.min(Math.max(0, finalPriceMWK ?? submission.priceMWK ?? 1500), 5000);
  const artistShare = Math.round(price * 0.7);
  const platformShare = price - artistShare;

  const newSongId = submission.publishedSongId || `song-${submission.artistId.substring(0, 8)}-${Date.now()}`;
  const newSong: Song = {
    id: newSongId,
    title: submission.title,
    artist: submission.artistName,
    artistId: submission.artistId,
    featuredArtists: submission.featuredArtists || '',
    genre: submission.genre || 'Afro-fusion',
    priceMWK: price,
    artistShareMWK: artistShare,
    platformShareMWK: platformShare,
    releaseDate: submission.releaseDate || new Date().toISOString().split('T')[0],
    coverImage: submission.coverImage || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop',
    description: submission.description || `Studio track by ${submission.artistName} on Projects Mandatory.`,
    lyrics: submission.lyrics || '',
    audioFilePath: submission.audioFilePath || '',
    audioFileName: submission.audioFileName || `${submission.title}.mp3`,
    fileFormat: submission.fileFormat || '320kbps MP3 Master',
    fileSize: submission.fileSize || 'Studio Master',
    isPublished: true,
    isLatest: true,
    downloadCount: 0,
    createdAt: new Date().toISOString(),
  };

  // Save to song catalog
  await saveSongToFirestore(newSong);

  // Update submission status
  const subDoc = doc(db, 'artistSubmissions', submission.id);
  await updateDoc(subDoc, {
    status: 'APPROVED',
    publishedSongId: newSongId,
    priceMWK: price,
    artistShareMWK: artistShare,
    platformShareMWK: platformShare,
    reviewedAt: new Date().toISOString(),
  });

  return newSongId;
}

// Reject artist submission
export async function rejectSongSubmission(
  submissionId: string,
  feedback: string
): Promise<void> {
  const subDoc = doc(db, 'artistSubmissions', submissionId);
  await updateDoc(subDoc, {
    status: 'REJECTED',
    adminFeedback: feedback || 'Track did not meet production or master requirements.',
    reviewedAt: new Date().toISOString(),
  });
}

// Delete submission
export async function deleteSongSubmission(submissionId: string): Promise<void> {
  const subDoc = doc(db, 'artistSubmissions', submissionId);
  await deleteDoc(subDoc);
}

// ==========================================
// FAN SUPPORT & ARTIST TIPPING (70/30 SPLIT)
// ==========================================

export async function createArtistSupportTip(
  tipData: Omit<ArtistSupportTip, 'id' | 'createdAt' | 'status' | 'artistShareMWK' | 'platformShareMWK'>
): Promise<string> {
  const tipId = `tip-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const tipDoc = doc(db, 'artistTips', tipId);

  const amount = Math.max(100, tipData.amountMWK);
  const artistShare = Math.round(amount * 0.7); // 70% to artist
  const platformShare = amount - artistShare; // 30% platform

  const payload: ArtistSupportTip = {
    ...tipData,
    id: tipId,
    amountMWK: amount,
    artistShareMWK: artistShare,
    platformShareMWK: platformShare,
    status: 'PAID', // Directly marked as paid for instant backing
    createdAt: new Date().toISOString(),
    paidAt: new Date().toISOString(),
  };

  await setDoc(tipDoc, payload);

  // Increment artist wallet balance & stats
  if (tipData.artistId) {
    const artistRef = doc(db, 'artists', tipData.artistId);
    try {
      await updateDoc(artistRef, {
        'wallet.totalEarnedMWK': increment(artistShare),
        'wallet.pendingPayoutMWK': increment(artistShare),
        'wallet.totalTipsReceivedMWK': increment(artistShare),
        'wallet.totalSupportersCount': increment(1),
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Could not update artist wallet on tip:', err);
    }
  }

  return tipId;
}

export function subscribeArtistTips(
  artistId: string,
  callback: (tips: ArtistSupportTip[]) => void
): Unsubscribe {
  const tipCol = collection(db, 'artistTips');
  const q = query(tipCol, where('artistId', '==', artistId));
  return onSnapshot(q, (snapshot) => {
    const list: ArtistSupportTip[] = [];
    snapshot.forEach((d) => {
      list.push({ ...(d.data() as ArtistSupportTip), id: d.id });
    });
    list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    callback(list);
  });
}

export function subscribeAllTips(
  callback: (tips: ArtistSupportTip[]) => void
): Unsubscribe {
  const tipCol = collection(db, 'artistTips');
  return onSnapshot(tipCol, (snapshot) => {
    const list: ArtistSupportTip[] = [];
    snapshot.forEach((d) => {
      list.push({ ...(d.data() as ArtistSupportTip), id: d.id });
    });
    list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    callback(list);
  });
}

// ==========================================
// ARTIST PAYOUT DISBURSEMENTS
// ==========================================

export async function processArtistPayout(
  artistId: string,
  amountMWK: number,
  adminNotes?: string,
  txRef?: string
): Promise<void> {
  const payoutId = `payout-${Date.now()}`;
  const payoutDoc = doc(db, 'artistPayouts', payoutId);

  const artistRef = doc(db, 'artists', artistId);
  const artistSnap = await getDoc(artistRef);
  const artistData = artistSnap.data() as ArtistProfile | undefined;

  const payload: ArtistPayoutRecord = {
    id: payoutId,
    artistId,
    artistName: artistData?.artistName || 'Artist',
    artistEmail: artistData?.email || '',
    amountMWK,
    payoutMethod: artistData?.payoutDetails?.accountType || 'AIRTEL_MONEY',
    accountNumber: artistData?.payoutDetails?.accountNumber || '',
    accountName: artistData?.payoutDetails?.accountName || artistData?.artistName || '',
    bankName: artistData?.payoutDetails?.bankName,
    status: 'PROCESSED',
    transactionRef: txRef || `TX-MW-${Date.now().toString().slice(-6)}`,
    adminNotes: adminNotes || 'Disbursed via Mobile Money',
    createdAt: new Date().toISOString(),
    processedAt: new Date().toISOString(),
  };

  await setDoc(payoutDoc, payload);

  // Update artist wallet pending balance
  if (artistSnap.exists()) {
    await updateDoc(artistRef, {
      'wallet.pendingPayoutMWK': increment(-amountMWK),
      'wallet.totalPaidOutMWK': increment(amountMWK),
      updatedAt: new Date().toISOString(),
    });
  }
}

export function subscribeArtistPayouts(
  artistId: string,
  callback: (payouts: ArtistPayoutRecord[]) => void
): Unsubscribe {
  const payoutCol = collection(db, 'artistPayouts');
  const q = query(payoutCol, where('artistId', '==', artistId));
  return onSnapshot(q, (snapshot) => {
    const list: ArtistPayoutRecord[] = [];
    snapshot.forEach((d) => {
      list.push({ ...(d.data() as ArtistPayoutRecord), id: d.id });
    });
    list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    callback(list);
  });
}

export function subscribeAllPayouts(
  callback: (payouts: ArtistPayoutRecord[]) => void
): Unsubscribe {
  const payoutCol = collection(db, 'artistPayouts');
  return onSnapshot(payoutCol, (snapshot) => {
    const list: ArtistPayoutRecord[] = [];
    snapshot.forEach((d) => {
      list.push({ ...(d.data() as ArtistPayoutRecord), id: d.id });
    });
    list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    callback(list);
  });
}

// ==========================================
// ORDERS & SALES
// ==========================================

// Subscribe to real-time orders (Admin / Customer)
export function subscribeOrders(
  callback: (orders: Order[]) => void,
  userEmail?: string
): Unsubscribe {
  const ordersCol = collection(db, 'orders');
  return onSnapshot(
    ordersCol,
    (snapshot) => {
      const orders: Order[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Order;
        if (!userEmail || data.customerEmail?.toLowerCase() === userEmail.toLowerCase()) {
          orders.push({ ...data, id: docSnap.id });
        }
      });
      orders.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      callback(orders);
    },
    (err) => {
      console.warn('Firestore orders subscription note:', err.message);
    }
  );
}

// Save or update Artist Settings in Firestore
export async function saveArtistSettingsToFirestore(settings: ArtistSettings): Promise<void> {
  const settingsRef = doc(db, 'artistSettings', 'current');
  await setDoc(settingsRef, {
    ...settings,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
}

// Subscribe to Artist Settings
export function subscribeArtistSettings(callback: (settings: ArtistSettings) => void): Unsubscribe {
  const settingsRef = doc(db, 'artistSettings', 'current');
  return onSnapshot(
    settingsRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as ArtistSettings);
      } else {
        callback(INITIAL_ARTIST_SETTINGS);
      }
    },
    (err) => {
      console.warn('Artist settings subscription note:', err.message);
    }
  );
}

// ==========================================
// MUSIC PROMOTION & SUBMISSION HELPERS
// ==========================================

export async function submitPromotionRequest(
  requestData: Omit<MusicPromotionRequest, 'id' | 'createdAt' | 'status'>
): Promise<string> {
  const requestId = `promo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const promoDoc = doc(db, 'promotionRequests', requestId);
  
  const payload: MusicPromotionRequest = {
    ...requestData,
    id: requestId,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  };

  await setDoc(promoDoc, payload);
  return requestId;
}

export function subscribePromotionRequests(
  callback: (requests: MusicPromotionRequest[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const promoCol = collection(db, 'promotionRequests');
  return onSnapshot(
    promoCol,
    (snapshot) => {
      const requests: MusicPromotionRequest[] = [];
      snapshot.forEach((d) => {
        requests.push({ ...(d.data() as MusicPromotionRequest), id: d.id });
      });
      requests.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      callback(requests);
    },
    (err) => {
      console.warn('Promotion requests subscription note:', err.message);
      if (onError) onError(err);
    }
  );
}

export async function updatePromotionRequestStatus(
  requestId: string,
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED',
  adminNotes?: string
): Promise<void> {
  const promoDoc = doc(db, 'promotionRequests', requestId);
  await updateDoc(promoDoc, {
    status,
    adminNotes: adminNotes || '',
    reviewedAt: new Date().toISOString(),
  });
}

export async function deletePromotionRequest(requestId: string): Promise<void> {
  const promoDoc = doc(db, 'promotionRequests', requestId);
  await deleteDoc(promoDoc);
}

// ==========================================
// WEBSITE CONTACT MESSAGES HELPERS
// ==========================================

export async function sendContactMessageToFirestore(
  messageData: Omit<ContactMessage, 'id' | 'createdAt' | 'read' | 'status'>
): Promise<string> {
  const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const messageDoc = doc(db, 'contactMessages', messageId);

  const payload: ContactMessage = {
    ...messageData,
    id: messageId,
    read: false,
    status: 'NEW',
    createdAt: new Date().toISOString(),
  };

  await setDoc(messageDoc, payload);
  return messageId;
}

export function subscribeContactMessages(
  callback: (messages: ContactMessage[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const messagesCol = collection(db, 'contactMessages');
  return onSnapshot(
    messagesCol,
    (snapshot) => {
      const messages: ContactMessage[] = [];
      snapshot.forEach((d) => {
        messages.push({ ...(d.data() as ContactMessage), id: d.id });
      });
      messages.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      callback(messages);
    },
    (err) => {
      console.warn('Contact messages subscription note:', err.message);
      if (onError) onError(err);
    }
  );
}

export async function markContactMessageRead(messageId: string, read: boolean = true): Promise<void> {
  const messageDoc = doc(db, 'contactMessages', messageId);
  await updateDoc(messageDoc, {
    read,
    status: read ? 'READ' : 'NEW',
  });
}

export async function deleteContactMessage(messageId: string): Promise<void> {
  const messageDoc = doc(db, 'contactMessages', messageId);
  await deleteDoc(messageDoc);
}

// ==========================================
// FIREBASE CLOUD STORAGE UPLOAD HELPERS
// ==========================================

export async function uploadAudioToStorage(
  file: File,
  onProgress?: (percent: number) => void
): Promise<{
  downloadUrl: string;
  storagePath: string;
  fileName: string;
  fileSize: string;
  fileFormat: string;
}> {
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `music/masters/${Date.now()}_${cleanName}`;
  const fileRef = ref(storage, storagePath);

  const uploadTask = uploadBytesResumable(fileRef, file, {
    contentType: file.type || 'audio/mpeg',
    customMetadata: {
      originalName: file.name,
      uploadedAt: new Date().toISOString(),
    },
  });

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(Math.round(progress));
      },
      (error) => {
        console.error('Firebase Storage audio upload error:', error);
        reject(error);
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
          const formatDesc = file.name.toLowerCase().endsWith('.wav')
            ? '24-bit WAV Studio Master'
            : file.name.toLowerCase().endsWith('.flac')
            ? 'Lossless FLAC Master'
            : '320kbps MP3 Master';

          resolve({
            downloadUrl,
            storagePath,
            fileName: file.name,
            fileSize: `${sizeInMB} MB`,
            fileFormat: formatDesc,
          });
        } catch (urlErr) {
          reject(urlErr);
        }
      }
    );
  });
}

export async function uploadCoverToStorage(
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ downloadUrl: string; storagePath: string }> {
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `covers/${Date.now()}_${cleanName}`;
  const fileRef = ref(storage, storagePath);

  const uploadTask = uploadBytesResumable(fileRef, file, {
    contentType: file.type || 'image/jpeg',
  });

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(Math.round(progress));
      },
      (error) => {
        console.error('Firebase Storage cover upload error:', error);
        reject(error);
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({ downloadUrl, storagePath });
        } catch (urlErr) {
          reject(urlErr);
        }
      }
    );
  });
}

// Initial Database Seeder
export async function seedInitialDataIfEmpty() {
  try {
    const settingsDoc = doc(db, 'artistSettings', 'current');
    const snap = await getDoc(settingsDoc);
    if (!snap.exists()) {
      await setDoc(settingsDoc, INITIAL_ARTIST_SETTINGS);
    }
  } catch (err) {
    console.warn('Initial seeding note:', err);
  }
}
