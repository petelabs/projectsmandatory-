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
  collection,
  query,
  where,
  getDocs,
  getDocFromServer,
  Timestamp,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App singleton
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Auth, Firestore & Storage instances
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Validate Connection to Firestore (Per skill guidelines)
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, '_connection_test', 'health'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore is currently running in offline mode or initializing.');
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
