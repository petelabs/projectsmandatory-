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
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';
import { Song, Order, ArtistSettings, UserProfile, MusicPromotionRequest, ContactMessage } from '../types';
import { INITIAL_ARTIST_SETTINGS, INITIAL_SONGS } from '../data/initialData';

// Official Contact WhatsApp Details (0984 67 96 91)
export const OFFICIAL_WHATSAPP_NUMBER = '0984 67 96 91';
export const OFFICIAL_WHATSAPP_LINK = 'https://wa.me/265984679691';

// Authorized Google Admin Accounts
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
// REAL-TIME FIRESTORE DATABASE HELPERS
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
      songs.sort((a, b) => new Date(b.releaseDate || 0).getTime() - new Date(a.releaseDate || 0).getTime());
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
  await setDoc(songRef, {
    ...song,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
}

// 4. Delete song from Firestore
export async function deleteSongFromFirestore(songId: string): Promise<void> {
  const songRef = doc(db, 'songs', songId);
  await deleteDoc(songRef);
}

// 5. Subscribe to real-time orders (Admin / Customer)
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

// 6. Save or update Artist Settings in Firestore
export async function saveArtistSettingsToFirestore(settings: ArtistSettings): Promise<void> {
  const settingsRef = doc(db, 'artistSettings', 'current');
  await setDoc(settingsRef, {
    ...settings,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
}

// 7. Subscribe to Artist Settings
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
// MUSIC PROMOTION & ARTIST SUBMISSION HELPERS
// ==========================================

// 8. Submit music promotion request
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

// 9. Subscribe to promotion requests in real-time (for Admin Dashboard)
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

// 10. Update promotion request status
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

// 11. Delete promotion request
export async function deletePromotionRequest(requestId: string): Promise<void> {
  const promoDoc = doc(db, 'promotionRequests', requestId);
  await deleteDoc(promoDoc);
}

// ==========================================
// WEBSITE CONTACT MESSAGES HELPERS
// ==========================================

// 12. Send a contact message from website to Firestore
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

// 13. Subscribe to real-time website contact messages (for Admin Dashboard)
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

// 14. Mark contact message as read / unread
export async function markContactMessageRead(messageId: string, read: boolean = true): Promise<void> {
  const messageDoc = doc(db, 'contactMessages', messageId);
  await updateDoc(messageDoc, {
    read,
    status: read ? 'READ' : 'NEW',
  });
}

// 15. Delete contact message from Firestore
export async function deleteContactMessage(messageId: string): Promise<void> {
  const messageDoc = doc(db, 'contactMessages', messageId);
  await deleteDoc(messageDoc);
}

// ==========================================
// FIREBASE CLOUD STORAGE UPLOAD HELPERS
// ==========================================

/**
 * Upload an Audio Master Recording (MP3 / WAV / FLAC) to Firebase Storage
 */
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

/**
 * Upload Cover Artwork Image to Firebase Storage
 */
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

// Initial Database Seeder: Seeds default artist settings if absent, keeps song catalog clean
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
