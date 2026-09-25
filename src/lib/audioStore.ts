// Persistent Client Audio & Cover Art Storage Engine using IndexedDB
// Seamlessly bridges local audio masters with cloud storage so tracks REALLY play immediately upon upload

const DB_NAME = 'pm_media_vault_v1';
const AUDIO_STORE = 'audio_masters';
const COVER_STORE = 'cover_art';

let dbPromise: Promise<IDBDatabase> | null = null;

function getMediaDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported on this platform'));
      return;
    }

    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(AUDIO_STORE)) {
        db.createObjectStore(AUDIO_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(COVER_STORE)) {
        db.createObjectStore(COVER_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });

  return dbPromise;
}

/**
 * Save an uncompressed audio master (File / Blob) locally in IndexedDB
 */
export async function storeLocalAudioFile(songId: string, file: Blob | File): Promise<string> {
  try {
    const db = await getMediaDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(AUDIO_STORE, 'readwrite');
      const store = tx.objectStore(AUDIO_STORE);
      const record = {
        id: songId,
        blob: file,
        name: (file as File).name || `${songId}.mp3`,
        type: file.type || 'audio/mpeg',
        size: file.size,
        updatedAt: Date.now(),
      };
      const req = store.put(record);
      req.onsuccess = () => resolve(`idb:${songId}`);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not cache audio file in IndexedDB:', err);
    return '';
  }
}

/**
 * Retrieve cached audio Blob by songId
 */
export async function getLocalAudioBlob(songId: string): Promise<Blob | null> {
  try {
    const db = await getMediaDB();
    return new Promise((resolve) => {
      const tx = db.transaction(AUDIO_STORE, 'readonly');
      const store = tx.objectStore(AUDIO_STORE);
      const req = store.get(songId);
      req.onsuccess = () => {
        if (req.result && req.result.blob) {
          resolve(req.result.blob);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Save Cover Artwork in IndexedDB
 */
export async function storeLocalCoverFile(songId: string, file: Blob | File): Promise<string> {
  try {
    const db = await getMediaDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(COVER_STORE, 'readwrite');
      const store = tx.objectStore(COVER_STORE);
      const record = {
        id: songId,
        blob: file,
        type: file.type || 'image/jpeg',
        updatedAt: Date.now(),
      };
      const req = store.put(record);
      req.onsuccess = () => resolve(`idb:${songId}`);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not cache cover in IndexedDB:', err);
    return '';
  }
}

/**
 * Retrieve cached Cover Blob by songId
 */
export async function getLocalCoverBlob(songId: string): Promise<Blob | null> {
  try {
    const db = await getMediaDB();
    return new Promise((resolve) => {
      const tx = db.transaction(COVER_STORE, 'readonly');
      const store = tx.objectStore(COVER_STORE);
      const req = store.get(songId);
      req.onsuccess = () => {
        if (req.result && req.result.blob) {
          resolve(req.result.blob);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

// In-memory object URL cache to avoid re-generating redundant object URLs
const objectUrlCache = new Map<string, string>();

/**
 * Resolve the real playable audio URL for a track:
 * 1. If remote http/https, returns it directly
 * 2. If starts with blob: or data:, returns it directly
 * 3. If IndexedDB reference or stored locally, generates active ObjectURL from real audio file blob
 */
export async function resolvePlayableAudioUrl(songId: string, audioFilePath?: string): Promise<string | null> {
  // If remote live URL
  if (audioFilePath && (audioFilePath.startsWith('http://') || audioFilePath.startsWith('https://') || audioFilePath.startsWith('data:'))) {
    return audioFilePath;
  }

  // Check if active Object URL in memory cache
  const cachedUrl = objectUrlCache.get(songId);
  if (cachedUrl) return cachedUrl;

  // Retrieve blob from IndexedDB
  const blob = await getLocalAudioBlob(songId);
  if (blob) {
    const url = URL.createObjectURL(blob);
    objectUrlCache.set(songId, url);
    return url;
  }

  return null;
}

/**
 * Resolve cover image (either remote URL or local ObjectURL)
 */
export async function resolveCoverImageUrl(songId: string, coverImageUrl?: string): Promise<string> {
  if (coverImageUrl && (coverImageUrl.startsWith('http://') || coverImageUrl.startsWith('https://') || coverImageUrl.startsWith('data:'))) {
    return coverImageUrl;
  }

  const cachedUrl = objectUrlCache.get(`cover_${songId}`);
  if (cachedUrl) return cachedUrl;

  const blob = await getLocalCoverBlob(songId);
  if (blob) {
    const url = URL.createObjectURL(blob);
    objectUrlCache.set(`cover_${songId}`, url);
    return url;
  }

  return coverImageUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop';
}
