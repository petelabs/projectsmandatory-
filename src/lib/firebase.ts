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
import { Song, Order, ArtistSettings, UserProfile } from '../types';
import { INITIAL_ARTIST_SETTINGS, INITIAL_SONGS } from '../data/initialData';

// Initialize Firebase App singleton
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Auth, Firestore & Cloud Storage instances
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

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
    if (!snap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        name: user.displayName || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        photoURL: user.photoURL || '',
        role: user.email === 'petedianolabs@gmail.com' ? 'admin' : 'customer',
        createdAt: new Date().toISOString(),
      });
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
  // Generate safe storage path in private music bucket
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `music/masters/${Date.now()}_${cleanName}`;
  const fileRef = ref(storage, storagePath);

  // Upload task with progress tracking
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

// Initial Database Seeder: Seeds catalog only if database is completely empty
export async function seedInitialDataIfEmpty() {
  try {
    const songsCol = collection(db, 'songs');
    const snap = await getDocs(songsCol);
    if (snap.empty) {
      console.log('[Firestore] Initializing official discography records...');
      for (const song of INITIAL_SONGS) {
        await setDoc(doc(db, 'songs', song.id), song);
      }
      await setDoc(doc(db, 'artistSettings', 'current'), INITIAL_ARTIST_SETTINGS);
    }
  } catch (err) {
    console.warn('Initial seeding note (will load on server/client):', err);
  }
}
