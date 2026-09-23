import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Playlist, Song, Album } from '../types';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { usePlayback } from './PlaybackContext';

export interface DownloadTask {
  songId: string;
  songTitle: string;
  artist: string;
  coverImage: string;
  progress: number; // 0 to 100
  status: 'PENDING' | 'DOWNLOADING' | 'PAUSED' | 'COMPLETED' | 'FAILED';
  error?: string;
  fileSize?: string;
}

export interface DownloadSettings {
  wifiOnly: boolean;
  quality: '320kbps' | '160kbps';
}

interface LibraryContextType {
  playlists: Playlist[];
  savedAlbumIds: string[];
  followedArtistIds: string[];
  downloadTasks: Record<string, DownloadTask>;
  downloadSettings: DownloadSettings;
  
  // Playlist Management
  createPlaylist: (params: { title: string; description?: string; coverImage?: string; isPublic?: boolean; initialSongs?: string[] }) => Playlist;
  editPlaylist: (playlistId: string, updates: Partial<{ title: string; description: string; coverImage: string; isPublic: boolean }>) => void;
  deletePlaylist: (playlistId: string) => void;
  addSongToPlaylist: (playlistId: string, songId: string) => boolean;
  removeSongFromPlaylist: (playlistId: string, songId: string) => void;
  reorderPlaylistSongs: (playlistId: string, fromIndex: number, toIndex: number) => void;
  saveQueueAsPlaylist: (title: string) => Playlist | null;
  getPlaylistById: (id: string) => Playlist | undefined;

  // Saved Albums Management
  toggleSaveAlbum: (albumId: string) => void;
  isAlbumSaved: (albumId: string) => boolean;

  // Followed Artists Management
  toggleFollowArtist: (artistId: string) => void;
  isArtistFollowed: (artistId: string) => boolean;

  // Download Management
  startDownloadTrack: (song: Song) => void;
  pauseDownload: (songId: string) => void;
  resumeDownload: (songId: string) => void;
  cancelDownload: (songId: string) => void;
  deleteDownload: (songId: string) => void;
  updateDownloadSettings: (settings: Partial<DownloadSettings>) => void;

  // Clear Recent History
  clearListeningHistory: () => void;
}

const DEFAULT_PLAYLISTS: Playlist[] = [
  {
    id: 'pl-chill-mw',
    title: 'Chill Vibes Malawi',
    description: 'Relaxing acoustic and modern Afro-fusion tracks from top Malawian talent.',
    coverImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=400&auto=format&fit=crop',
    curator: 'Projects Mandatory',
    isEditorial: true,
    isMalawiSpecial: true,
    songIds: ['song-tiyende', 'song-sikono'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'pl-[#1455D9]',
    title: 'Warm Heart Afrobeats',
    description: 'Upbeat Afro-pop and urban bangers designed for summer drives and parties.',
    coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400&auto=format&fit=crop',
    curator: 'Projects Mandatory',
    isEditorial: true,
    isMalawiSpecial: true,
    songIds: ['song-sikono'],
    createdAt: new Date().toISOString(),
  },
];

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export const LibraryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { queue } = usePlayback();

  // 1. Playlists
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    try {
      const saved = localStorage.getItem('pm_user_playlists');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_PLAYLISTS;
  });

  // 2. Saved Albums
  const [savedAlbumIds, setSavedAlbumIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pm_saved_albums');
      if (saved) return JSON.parse(saved);
    } catch {}
    return ['album-hapsin-debut'];
  });

  // 3. Followed Artists
  const [followedArtistIds, setFollowedArtistIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pm_followed_artists');
      if (saved) return JSON.parse(saved);
    } catch {}
    return ['artist-hapsin'];
  });

  // 4. Download Tasks & Settings
  const [downloadTasks, setDownloadTasks] = useState<Record<string, DownloadTask>>(() => {
    try {
      const saved = localStorage.getItem('pm_download_tasks');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  const [downloadSettings, setDownloadSettings] = useState<DownloadSettings>(() => {
    try {
      const saved = localStorage.getItem('pm_download_settings');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { wifiOnly: false, quality: '320kbps' };
  });

  // Persistence Effects
  useEffect(() => {
    try {
      localStorage.setItem('pm_user_playlists', JSON.stringify(playlists));
    } catch {}
  }, [playlists]);

  useEffect(() => {
    try {
      localStorage.setItem('pm_saved_albums', JSON.stringify(savedAlbumIds));
    } catch {}
  }, [savedAlbumIds]);

  useEffect(() => {
    try {
      localStorage.setItem('pm_followed_artists', JSON.stringify(followedArtistIds));
    } catch {}
  }, [followedArtistIds]);

  useEffect(() => {
    try {
      localStorage.setItem('pm_download_tasks', JSON.stringify(downloadTasks));
    } catch {}
  }, [downloadTasks]);

  useEffect(() => {
    try {
      localStorage.setItem('pm_download_settings', JSON.stringify(downloadSettings));
    } catch {}
  }, [downloadSettings]);

  // ==================== PLAYLIST ACTIONS ====================

  const createPlaylist = useCallback(
    (params: {
      title: string;
      description?: string;
      coverImage?: string;
      isPublic?: boolean;
      initialSongs?: string[];
    }): Playlist => {
      const newPlaylist: Playlist = {
        id: `pl-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        title: params.title.trim() || 'My Playlist',
        description: params.description?.trim() || '',
        coverImage:
          params.coverImage ||
          'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=400&auto=format&fit=crop',
        curator: user?.name || 'Listener',
        isEditorial: false,
        isMalawiSpecial: false,
        songIds: params.initialSongs || [],
        createdAt: new Date().toISOString(),
      };

      setPlaylists((prev) => [newPlaylist, ...prev]);
      showToast(`Created playlist "${newPlaylist.title}"`, 'success');
      return newPlaylist;
    },
    [user?.name, showToast]
  );

  const editPlaylist = useCallback(
    (
      playlistId: string,
      updates: Partial<{ title: string; description: string; coverImage: string; isPublic: boolean }>
    ) => {
      setPlaylists((prev) =>
        prev.map((pl) => {
          if (pl.id === playlistId) {
            return {
              ...pl,
              ...updates,
              title: updates.title !== undefined ? updates.title.trim() : pl.title,
            };
          }
          return pl;
        })
      );
      showToast('Playlist updated', 'success');
    },
    [showToast]
  );

  const deletePlaylist = useCallback(
    (playlistId: string) => {
      setPlaylists((prev) => prev.filter((pl) => pl.id !== playlistId));
      showToast('Playlist deleted', 'info');
    },
    [showToast]
  );

  const addSongToPlaylist = useCallback(
    (playlistId: string, songId: string): boolean => {
      let added = false;
      let playlistTitle = '';

      setPlaylists((prev) =>
        prev.map((pl) => {
          if (pl.id === playlistId) {
            playlistTitle = pl.title;
            if (!pl.songIds.includes(songId)) {
              added = true;
              return { ...pl, songIds: [...pl.songIds, songId] };
            }
          }
          return pl;
        })
      );

      if (added) {
        showToast(`Added to "${playlistTitle}"`, 'success');
      } else {
        showToast(`Song already in "${playlistTitle}"`, 'info');
      }
      return added;
    },
    [showToast]
  );

  const removeSongFromPlaylist = useCallback(
    (playlistId: string, songId: string) => {
      setPlaylists((prev) =>
        prev.map((pl) => {
          if (pl.id === playlistId) {
            return { ...pl, songIds: pl.songIds.filter((id) => id !== songId) };
          }
          return pl;
        })
      );
      showToast('Song removed from playlist', 'info');
    },
    [showToast]
  );

  const reorderPlaylistSongs = useCallback(
    (playlistId: string, fromIndex: number, toIndex: number) => {
      setPlaylists((prev) =>
        prev.map((pl) => {
          if (pl.id === playlistId) {
            const newSongIds = [...pl.songIds];
            const [moved] = newSongIds.splice(fromIndex, 1);
            newSongIds.splice(toIndex, 0, moved);
            return { ...pl, songIds: newSongIds };
          }
          return pl;
        })
      );
    },
    []
  );

  const saveQueueAsPlaylist = useCallback(
    (title: string): Playlist | null => {
      if (queue.length === 0) {
        showToast('Your play queue is currently empty', 'error');
        return null;
      }
      const songIds = queue.map((s) => s.id);
      const coverImage = queue[0]?.coverImage || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=400&auto=format&fit=crop';
      return createPlaylist({
        title,
        description: `Saved from active queue (${queue.length} tracks)`,
        coverImage,
        initialSongs: songIds,
      });
    },
    [queue, createPlaylist, showToast]
  );

  const getPlaylistById = useCallback(
    (id: string): Playlist | undefined => {
      return playlists.find((p) => p.id === id);
    },
    [playlists]
  );

  // ==================== SAVED ALBUMS ACTIONS ====================

  const toggleSaveAlbum = useCallback(
    (albumId: string) => {
      setSavedAlbumIds((prev) => {
        const isSaved = prev.includes(albumId);
        const updated = isSaved ? prev.filter((id) => id !== albumId) : [...prev, albumId];
        showToast(isSaved ? 'Album removed from library' : 'Album saved to library', 'success');
        return updated;
      });
    },
    [showToast]
  );

  const isAlbumSaved = useCallback(
    (albumId: string) => savedAlbumIds.includes(albumId),
    [savedAlbumIds]
  );

  // ==================== FOLLOWED ARTISTS ACTIONS ====================

  const toggleFollowArtist = useCallback(
    (artistId: string) => {
      setFollowedArtistIds((prev) => {
        const isFollowed = prev.includes(artistId);
        const updated = isFollowed ? prev.filter((id) => id !== artistId) : [...prev, artistId];
        showToast(isFollowed ? 'Unfollowed artist' : 'Following artist!', 'success');
        return updated;
      });
    },
    [showToast]
  );

  const isArtistFollowed = useCallback(
    (artistId: string) => followedArtistIds.includes(artistId),
    [followedArtistIds]
  );

  // ==================== DOWNLOAD MANAGEMENT ====================

  const startDownloadTrack = useCallback(
    (song: Song) => {
      if (!song) return;

      const task: DownloadTask = {
        songId: song.id,
        songTitle: song.title,
        artist: song.artist,
        coverImage: song.coverImage,
        progress: 0,
        status: 'DOWNLOADING',
        fileSize: song.fileSize || '8.5 MB',
      };

      setDownloadTasks((prev) => ({ ...prev, [song.id]: task }));
      showToast(`Downloading "${song.title}"...`, 'info');

      // Simulate step progress
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += 20;
        if (currentProgress >= 100) {
          clearInterval(interval);
          setDownloadTasks((prev) => ({
            ...prev,
            [song.id]: {
              ...prev[song.id],
              progress: 100,
              status: 'COMPLETED',
            },
          }));
          showToast(`"${song.title}" downloaded for offline play`, 'success');
        } else {
          setDownloadTasks((prev) => {
            if (!prev[song.id] || prev[song.id].status !== 'DOWNLOADING') {
              clearInterval(interval);
              return prev;
            }
            return {
              ...prev,
              [song.id]: {
                ...prev[song.id],
                progress: currentProgress,
              },
            };
          });
        }
      }, 500);
    },
    [showToast]
  );

  const pauseDownload = useCallback((songId: string) => {
    setDownloadTasks((prev) => {
      if (!prev[songId]) return prev;
      return {
        ...prev,
        [songId]: { ...prev[songId], status: 'PAUSED' },
      };
    });
  }, []);

  const resumeDownload = useCallback(
    (songId: string) => {
      setDownloadTasks((prev) => {
        if (!prev[songId]) return prev;
        return {
          ...prev,
          [songId]: { ...prev[songId], status: 'DOWNLOADING' },
        };
      });
      showToast('Resuming download', 'info');
    },
    [showToast]
  );

  const cancelDownload = useCallback(
    (songId: string) => {
      setDownloadTasks((prev) => {
        const updated = { ...prev };
        delete updated[songId];
        return updated;
      });
      showToast('Download cancelled', 'info');
    },
    [showToast]
  );

  const deleteDownload = useCallback(
    (songId: string) => {
      setDownloadTasks((prev) => {
        const updated = { ...prev };
        delete updated[songId];
        return updated;
      });
      // Also sync offline songs in localStorage
      try {
        const saved = localStorage.getItem('pm_offline_tracks');
        if (saved) {
          const list: string[] = JSON.parse(saved);
          localStorage.setItem('pm_offline_tracks', JSON.stringify(list.filter((id) => id !== songId)));
        }
      } catch {}
      showToast('Download removed', 'info');
    },
    [showToast]
  );

  const updateDownloadSettings = useCallback((settingsUpdates: Partial<DownloadSettings>) => {
    setDownloadSettings((prev) => ({ ...prev, ...settingsUpdates }));
  }, []);

  // ==================== HISTORY CLEAR ====================

  const clearListeningHistory = useCallback(() => {
    try {
      localStorage.removeItem('pm_play_history');
    } catch {}
    showToast('Listening history cleared', 'info');
  }, [showToast]);

  return (
    <LibraryContext.Provider
      value={{
        playlists,
        savedAlbumIds,
        followedArtistIds,
        downloadTasks,
        downloadSettings,
        createPlaylist,
        editPlaylist,
        deletePlaylist,
        addSongToPlaylist,
        removeSongFromPlaylist,
        reorderPlaylistSongs,
        saveQueueAsPlaylist,
        getPlaylistById,
        toggleSaveAlbum,
        isAlbumSaved,
        toggleFollowArtist,
        isArtistFollowed,
        startDownloadTrack,
        pauseDownload,
        resumeDownload,
        cancelDownload,
        deleteDownload,
        updateDownloadSettings,
        clearListeningHistory,
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
};

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
}
